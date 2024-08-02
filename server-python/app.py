from flask import Flask, request, jsonify
import boto3
import requests
from threading import Thread
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
s3_client = boto3.client('s3')

# Get the bucket name from the environment variable
bucket_name = os.getenv('S3_BUCKET_NAME')

def gen_ps_url(bucket_name, object_name):
    url = s3_client.generate_presigned_url(
        ClientMethod='put_object',
        Params={'Bucket': bucket_name, 'Key': object_name},
        ExpiresIn=3600,
        HttpMethod='PUT'
    )
    return url

@app.route('/upload_file', methods=['POST'])
def upload_file():
    data = request.form
    file = request.files['file']

    if not bucket_name or not file:
        return jsonify({"error": "Bucket name and file are required"}), 400

    object_name = file.filename
    presigned_url = gen_ps_url(bucket_name, object_name)
    response = requests.put(presigned_url, data=file)

    if response.status_code == 200:
        return jsonify({"message": "File uploaded successfully"}), 200
    else:
        return jsonify({"error": "Failed to upload file", "details": response.content.decode()}), response.status_code

@app.route('/create_folder', methods=['POST'])
def create_folder():
    data = request.form
    folder_name = data.get('folder_name')

    if not bucket_name or not folder_name:
        return jsonify({"error": "Bucket name and folder name are required"}), 400

    # Ensure the folder name ends with a '/'
    if not folder_name.endswith('/'):
        folder_name += '/'

    try:
        s3_client.put_object(Bucket=bucket_name, Key=folder_name)
        return jsonify({"message": f"Folder '{folder_name}' created successfully in bucket '{bucket_name}'."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Run the Flask app in a separate thread
def run_flask_app():
    app.run(debug=True, use_reloader=False)

# Create and start a thread to run the Flask app
flask_thread = Thread(target=run_flask_app)
flask_thread.start()
