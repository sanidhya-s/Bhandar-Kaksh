import os
import boto3
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify

load_dotenv()

AWS_ACCESS_KEY_ID=os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY=os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_DEFAULT_REGION=os.getenv('AWS_DEFAULT_REGION')
bucket_name = os.getenv('S3_BUCKET_NAME')
print(bucket_name)

app = Flask(__name__)

# Initialize the S3 client with your credentials
client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)

# Function to generate a pre-signed URL
def gen_pre_signed_url(bucket_name, object_name, expiration=3600):
    url = client.generate_presigned_url(
        ClientMethod='put_object',
        Params={'Bucket': bucket_name, 'Key': object_name},
        ExpiresIn=expiration,
        HttpMethod='PUT'
    )
    return url

# Flask route for handling multiple file uploads
@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400

    files = request.files.getlist('files')  # Retrieve the list of files
    upload_responses = []

    # Process each file
    for file in files:
        original_filename = file.filename  # Preserve the original filename
        object_name = f"{original_filename}"  # Use original name in S3 path
        presigned_url = gen_pre_signed_url(bucket_name=bucket_name, object_name=object_name)

        # Upload the file using the pre-signed URL
        response = requests.put(presigned_url, data=file.read())  # read() gets the file data

        # Collect each file's response
        if response.status_code == 200:
            upload_responses.append({
                "file_name": original_filename,
                "status": "success",
                "file_url": presigned_url
            })
        else:
            upload_responses.append({
                "file_name": original_filename,
                "status": "failed",
                "status_code": response.status_code,
                "response": response.text
            })

    # Return the list of upload responses
    return jsonify(upload_responses), 200


@app.route('/list-files', methods=['GET'])
def list_files():

    try:
        # Fetch the list of files from the bucket
        response = client.list_objects_v2(Bucket=bucket_name)

        if 'Contents' in response:
            files = [{"key": obj['Key'], "size": obj['Size']} for obj in response['Contents']]
            return jsonify(files), 200
        else:
            return jsonify({"message": "No files found in the bucket."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/delete-files', methods=['DELETE'])
def delete_files():
    # Parse the list of file names from the request body
    data = request.get_json()
    if not data or 'file_names' not in data:
        return jsonify({"error": "file_names key with a list of file names is required in the request body"}), 400

    file_names = data['file_names']
    if not isinstance(file_names, list) or not file_names:
        return jsonify({"error": "file_names must be a non-empty list"}), 400

    delete_responses = []

    for file_name in file_names:
        try:
            # Delete the file from the S3 bucket
            response = client.delete_object(Bucket=bucket_name, Key=file_name)

            # Check if the deletion was successful
            if response.get('ResponseMetadata', {}).get('HTTPStatusCode') == 204:
                delete_responses.append({
                    "file_name": file_name,
                    "status": "deleted"
                })
            else:
                delete_responses.append({
                    "file_name": file_name,
                    "status": "failed",
                    "error": "Unknown error"
                })
        except client.exceptions.NoSuchKey:
            delete_responses.append({
                "file_name": file_name,
                "status": "failed",
                "error": "File does not exist"
            })
        except Exception as e:
            delete_responses.append({
                "file_name": file_name,
                "status": "failed",
                "error": str(e)
            })

    return jsonify(delete_responses), 200


if __name__ == '__main__':
    app.run(debug=True)
