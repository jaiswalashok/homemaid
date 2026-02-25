#!/bin/bash

# Check SSH Setup for GitHub Accounts

echo "🔍 Checking SSH Setup for GitHub Accounts"
echo "=========================================="
echo ""

# Check for SSH keys
echo "📁 Checking for SSH keys..."
echo ""

if [ -f ~/.ssh/id_ed25519_jaiswals ]; then
    echo "✓ Jaiswals SSH key exists: ~/.ssh/id_ed25519_jaiswals"
else
    echo "✗ Jaiswals SSH key NOT found: ~/.ssh/id_ed25519_jaiswals"
    echo "  Run: ssh-keygen -t ed25519 -C 'ashok@jaiswals.live' -f ~/.ssh/id_ed25519_jaiswals"
fi

if [ -f ~/.ssh/id_ed25519_personal ]; then
    echo "✓ Personal SSH key exists: ~/.ssh/id_ed25519_personal"
else
    echo "✗ Personal SSH key NOT found: ~/.ssh/id_ed25519_personal"
fi

if [ -f ~/.ssh/id_ed25519_company ]; then
    echo "✓ Company SSH key exists: ~/.ssh/id_ed25519_company"
else
    echo "✗ Company SSH key NOT found: ~/.ssh/id_ed25519_company"
fi

echo ""
echo "🔑 Checking SSH agent..."
ssh-add -l 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ SSH agent is running with keys loaded"
else
    echo "✗ No keys in SSH agent"
    echo "  Run: eval \"\$(ssh-agent -s)\" && ssh-add ~/.ssh/id_ed25519_jaiswals"
fi

echo ""
echo "⚙️  Checking SSH config..."
if [ -f ~/.ssh/config ]; then
    echo "✓ SSH config exists"
    if grep -q "github-jaiswals" ~/.ssh/config; then
        echo "✓ github-jaiswals entry found in SSH config"
    else
        echo "✗ github-jaiswals entry NOT found in SSH config"
    fi
else
    echo "✗ SSH config NOT found: ~/.ssh/config"
fi

echo ""
echo "🧪 Testing SSH connections..."
echo ""

echo "Testing github-jaiswals..."
ssh -T git@github-jaiswals 2>&1 | head -1

echo ""
echo "Testing github.com (default)..."
ssh -T git@github.com 2>&1 | head -1

echo ""
echo "=========================================="
echo "Current repository remote:"
git remote -v
