from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS

s3_client = boto3.client('s3',
                         aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                         aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                         region_name=os.getenv('AWS_REGION'))

# Get the bucket name from the environment variable
bucket_name = os.getenv('S3_BUCKET_NAME')

def gen_ps_url(bucket_name, object_name):
    try:
        url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={'Bucket': bucket_name, 'Key': object_name},
            ExpiresIn=3600,
            HttpMethod='PUT'
        )
        app.logger.info(f'Generated pre-signed URL: {url}')
        return url
    except Exception as e:
        app.logger.error(f'Error generating pre-signed URL: {str(e)}')
        return None

@app.route('/generate_presigned_url', methods=['POST'])
def generate_presigned_url():
    data = request.json
    file_name = data.get('file_name')

    if not bucket_name or not file_name:
        return jsonify({"error": "Bucket name and file name are required"}), 400

    presigned_url = gen_ps_url(bucket_name, file_name)
    if presigned_url:
        return jsonify({"url": presigned_url}), 200
    else:
        return jsonify({"error": "Failed to generate pre-signed URL"}), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
