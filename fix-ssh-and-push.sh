#!/bin/bash

# Quick fix for SSH and push to jaiswalashok/homemaid

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up SSH for jaiswalashok GitHub account${NC}"
echo "=================================================="
echo ""

# Step 1: Check if SSH key exists
if [ ! -f ~/.ssh/id_ed25519_jaiswals ]; then
    echo "📝 Generating SSH key for jaiswalashok..."
    ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals -N ""
    echo -e "${GREEN}✓ SSH key generated${NC}"
else
    echo -e "${GREEN}✓ SSH key already exists${NC}"
fi

echo ""

# Step 2: Start SSH agent and add key
echo "🔑 Adding SSH key to agent..."
eval "$(ssh-agent -s)" > /dev/null
ssh-add ~/.ssh/id_ed25519_jaiswals 2>/dev/null || true
echo -e "${GREEN}✓ Key added to SSH agent${NC}"

echo ""

# Step 3: Setup SSH config
echo "⚙️  Configuring SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

if [ ! -f ~/.ssh/config ]; then
    touch ~/.ssh/config
    chmod 600 ~/.ssh/config
fi

if ! grep -q "Host github-jaiswals" ~/.ssh/config; then
    cat >> ~/.ssh/config << 'EOF'

# Jaiswals GitHub (jaiswalashok)
Host github-jaiswals
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jaiswals
    IdentitiesOnly yes
EOF
    echo -e "${GREEN}✓ SSH config updated${NC}"
else
    echo -e "${GREEN}✓ SSH config already configured${NC}"
fi

echo ""

# Step 4: Display public key
echo "📋 Your SSH Public Key:"
echo "======================="
cat ~/.ssh/id_ed25519_jaiswals.pub
echo ""
echo "======================="
echo ""

# Copy to clipboard
cat ~/.ssh/id_ed25519_jaiswals.pub | pbcopy
echo -e "${GREEN}✓ Public key copied to clipboard!${NC}"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Add this SSH key to GitHub${NC}"
echo ""
echo "1. Go to: https://github.com/settings/ssh/new"
echo "2. Title: HomeMaid Development Mac"
echo "3. Paste the key (already in clipboard)"
echo "4. Click 'Add SSH key'"
echo ""
read -p "Press ENTER after you've added the key to GitHub..."

echo ""
echo "🧪 Testing SSH connection..."
if ssh -T git@github-jaiswals 2>&1 | grep -q "successfully authenticated\|Hi jaiswalashok"; then
    echo -e "${GREEN}✓ SSH connection successful!${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo ""
    echo "Manual test: ssh -T git@github-jaiswals"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo -e "${GREEN}✓ Success! Code pushed to jaiswalashok/homemaid${NC}"
