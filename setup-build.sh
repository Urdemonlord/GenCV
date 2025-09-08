#!/bin/bash

# Tambahkan tsup ke root project
echo "Installing tsup in root project..."
npm install --save-dev tsup

# Persiapkan folder
mkdir -p packages/lib-ai/dist
mkdir -p packages/types/dist
mkdir -p packages/utils/dist
mkdir -p packages/ui/dist

echo "Setup completed!"
