#!/bin/bash

echo "========================================"
echo "  PostPilot - Google OAuth Setup"
echo "========================================"
echo ""
echo "To enable Google login, you need OAuth credentials."
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Create a project (if needed)"
echo "3. Click 'Create Credentials' > 'OAuth client ID'"
echo "4. Select 'Web application'"
echo "5. Add this redirect URI:"
echo "   http://localhost:3005/api/auth/google/callback"
echo ""
echo "Then enter your credentials below:"
echo ""

read -p "Google Client ID: " CLIENT_ID
read -p "Google Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo ""
    echo "Error: Both Client ID and Client Secret are required."
    exit 1
fi

# Update .env file (script should be run from project root)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
sed -i "s/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$CLIENT_ID/" "$SCRIPT_DIR/.env"
sed -i "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$CLIENT_SECRET/" "$SCRIPT_DIR/.env"

echo ""
echo "✅ Credentials saved to .env"
echo ""
echo "Now restart the backend server:"
echo "  npm run dev"
echo ""
echo "Or manually:"
echo "  pkill -f 'node src/server.js'"
echo "  PORT=3005 node src/server.js &"
