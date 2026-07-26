from fastapi.testclient import TestClient
from main import app
from core.security import verify_access_token
client = TestClient(app)

def run_tests():
    print("Testing signup...")

    # Test Signup
    res = client.post("/auth/signup", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    token = data["access_token"]
    
    # Verify the token is valid
    uid = verify_access_token(token)
    assert uid == data["user"]["uid"]
    print("Signup and JWT generation OK")
    print("Testing duplicate signup...")
    # Test Duplicate Signup
    res = client.post("/auth/signup", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 409, res.text
    print("Duplicate check OK")
    print("Testing signin...")
    # Test Signin
    res = client.post("/auth/signin", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 200, res.text
    data2 = res.json()
    assert data2["access_token"] != ""
    assert data2["user"]["email"] == "test@example.com"
    print("Signin OK")
    print("Testing /auth/me with token...")
    # Test /auth/me
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    assert res.json()["email"] == "test@example.com"
    print("/auth/me OK")
    
    print("Testing missing token for /auth/me...")
    res = client.get("/auth/me")
    assert res.status_code == 401
    print("Missing token check OK")
    print("Testing invalid token for /auth/me...")
    res = client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert res.status_code == 401
    print("Invalid token check OK")
    
    print("All auth tests passed!")
if __name__ == "__main__":
    run_tests()