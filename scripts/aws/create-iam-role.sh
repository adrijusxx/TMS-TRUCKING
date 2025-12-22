#!/bin/bash

# AWS IAM Role Creation Script
# 
# This script creates an IAM role and instance profile for EC2 instances
# to access AWS Secrets Manager.
#
# Usage:
#   ./scripts/aws/create-iam-role.sh [region]
#
# Requirements:
#   - AWS CLI installed and configured
#   - Appropriate AWS credentials with IAM permissions

set -e

REGION=${1:-us-east-1}
ROLE_NAME="TMS-EC2-SecretsAccess"
PROFILE_NAME="TMS-EC2-Profile"

echo "🔐 Creating IAM role and instance profile for Secrets Manager access"
echo ""

# Create trust policy file
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

# Create secrets policy file
SECRETS_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:tms/*"
      ]
    }
  ]
}
EOF
)

echo "📝 Creating IAM role: $ROLE_NAME"

# Check if role already exists
if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "  ⚠️  Role already exists. Skipping creation..."
else
  echo "$TRUST_POLICY" > /tmp/trust-policy.json
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    --description "IAM role for TMS EC2 instances to access Secrets Manager" > /dev/null
  echo "  ✅ Role created"
  rm /tmp/trust-policy.json
fi

echo ""
echo "📝 Attaching Secrets Manager policy to role"

echo "$SECRETS_POLICY" > /tmp/secrets-policy.json
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name SecretsManagerAccess \
  --policy-document file:///tmp/secrets-policy.json > /dev/null
echo "  ✅ Policy attached"
rm /tmp/secrets-policy.json

echo ""
echo "📝 Creating instance profile: $PROFILE_NAME"

# Check if instance profile already exists
if aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" &>/dev/null; then
  echo "  ⚠️  Instance profile already exists"
  
  # Check if role is already attached
  ATTACHED_ROLES=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" --query 'InstanceProfile.Roles[*].RoleName' --output text)
  if echo "$ATTACHED_ROLES" | grep -q "$ROLE_NAME"; then
    echo "  ✅ Role is already attached to instance profile"
  else
    echo "  📎 Adding role to instance profile..."
    aws iam add-role-to-instance-profile \
      --instance-profile-name "$PROFILE_NAME" \
      --role-name "$ROLE_NAME" > /dev/null
    echo "  ✅ Role attached to instance profile"
  fi
else
  aws iam create-instance-profile \
    --instance-profile-name "$PROFILE_NAME" > /dev/null
  echo "  ✅ Instance profile created"
  
  echo "  📎 Adding role to instance profile..."
  aws iam add-role-to-instance-profile \
    --instance-profile-name "$PROFILE_NAME" \
    --role-name "$ROLE_NAME" > /dev/null
  echo "  ✅ Role attached to instance profile"
fi

echo ""
echo "✅ IAM setup complete!"
echo ""
echo "Instance Profile ARN:"
INSTANCE_PROFILE_ARN=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" --query 'InstanceProfile.Arn' --output text)
echo "  $INSTANCE_PROFILE_ARN"
echo ""
echo "Next steps:"
echo "1. Attach instance profile to EC2 instance:"
echo "   - Via AWS Console: EC2 → Instances → Select instance → Actions → Security → Modify IAM role"
echo "   - Via CLI: aws ec2 associate-iam-instance-profile --instance-id <instance-id> --iam-instance-profile Name=$PROFILE_NAME"
echo "2. Set AWS_REGION=$REGION on EC2 instance"
echo "3. Deploy application"

