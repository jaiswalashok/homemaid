#!/bin/bash

# HomeMaid GitHub SSH Setup Script
# This script helps set up SSH authentication for the jaiswalashok GitHub account

set -e

echo "🔐 HomeMaid GitHub SSH Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if SSH key already exists
if [ -f ~/.ssh/id_ed25519_jaiswals ]; then
    echo -e "${YELLOW}⚠️  SSH key for jaiswalashok already exists at ~/.ssh/id_ed25519_jaiswals${NC}"
    read -p "Do you want to use the existing key? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Generating new SSH key..."
        ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals
    fi
else
    echo "📝 Generating SSH key for jaiswalashok account..."
    ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals
fi

# Start SSH agent and add key
echo ""
echo "🔑 Adding SSH key to agent..."
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_jaiswals

# Copy public key to clipboard
echo ""
echo "📋 Copying public key to clipboard..."
cat ~/.ssh/id_ed25519_jaiswals.pub | pbcopy
echo -e "${GREEN}✓ Public key copied to clipboard!${NC}"

# Display the public key
echo ""
echo "Your public key:"
echo "================"
cat ~/.ssh/id_ed25519_jaiswals.pub
echo ""

# Check if SSH config exists and add entry
echo "⚙️  Configuring SSH config..."
SSH_CONFIG=~/.ssh/config

# Create SSH config if it doesn't exist
if [ ! -f "$SSH_CONFIG" ]; then
    touch "$SSH_CONFIG"
    chmod 600 "$SSH_CONFIG"
fi

# Check if entry already exists
if grep -q "Host github-jaiswals" "$SSH_CONFIG"; then
    echo -e "${YELLOW}⚠️  SSH config entry for github-jaiswals already exists${NC}"
else
    echo "" >> "$SSH_CONFIG"
    echo "# Jaiswals GitHub (jaiswalashok)" >> "$SSH_CONFIG"
    echo "Host github-jaiswals" >> "$SSH_CONFIG"
    echo "    HostName github.com" >> "$SSH_CONFIG"
    echo "    User git" >> "$SSH_CONFIG"
    echo "    IdentityFile ~/.ssh/id_ed25519_jaiswals" >> "$SSH_CONFIG"
    echo "    IdentitiesOnly yes" >> "$SSH_CONFIG"
    echo -e "${GREEN}✓ SSH config entry added!${NC}"
fi

# Configure git for this repository
echo ""
echo "🔧 Configuring git for HomeMaid repository..."
git config user.name "jaiswalashok"
git config user.email "ashok@jaiswals.live"
echo -e "${GREEN}✓ Git user configured!${NC}"

# Check if remote exists
if git remote | grep -q "origin"; then
    echo ""
    echo -e "${YELLOW}⚠️  Remote 'origin' already exists${NC}"
    echo "Current remote URL:"
    git remote get-url origin
    echo ""
    read -p "Do you want to update it to use SSH? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin git@github-jaiswals:jaiswalashok/homemaid.git
        echo -e "${GREEN}✓ Remote URL updated!${NC}"
    fi
else
    git remote add origin git@github-jaiswals:jaiswalashok/homemaid.git
    echo -e "${GREEN}✓ Remote 'origin' added!${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. Go to https://github.com/settings/keys"
echo "2. Click 'New SSH key'"
echo "3. Paste the key (already in your clipboard)"
echo "4. Give it a title like 'HomeMaid Development'"
echo "5. Click 'Add SSH key'"
echo ""
echo "Then test the connection:"
echo "  ssh -T git@github-jaiswals"
echo ""
echo "Finally, push your code:"
echo "  git add ."
echo "  git commit -m \"Initial commit: HomeMaid family AI assistant\""
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
