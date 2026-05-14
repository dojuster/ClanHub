import firebase_admin
from firebase_admin import credentials, auth

# Path to the JSON file you downloaded
cred = credentials.Certificate("path/to/your-service-account-file.json")
firebase_admin.initialize_app(cred)

def verify_user(id_token):
    try:
        # This verifies the user on the server side
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        print(f"Verified user: {uid}")
    except Exception as e:
        print("Invalid token")

# You can now use Python to manage users, 
# set custom claims (roles), or audit logs.