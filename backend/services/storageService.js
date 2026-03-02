const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Upload file to S3
const uploadToS3 = async (file, folder = 'documents') => {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private' // Files are private by default
    };

    const result = await s3.upload(params).promise();
    
    return {
      success: true,
      fileUrl: result.Location,
      fileName: fileName,
      bucket: BUCKET_NAME
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get signed URL for private file access
const getSignedUrl = async (fileName, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Expires: expiresIn // URL expires in 1 hour by default
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Get signed URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from S3
const deleteFromS3 = async (fileName) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName
    };

    await s3.deleteObject(params).promise();
    
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// List files in a folder
const listFiles = async (folder = 'documents', maxKeys = 100) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: folder + '/',
      MaxKeys: maxKeys
    };

    const result = await s3.listObjectsV2(params).promise();
    
    return {
      success: true,
      files: result.Contents.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified
      }))
    };
  } catch (error) {
    console.error('S3 list error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadToS3,
  getSignedUrl,
  deleteFromS3,
  listFiles
};
