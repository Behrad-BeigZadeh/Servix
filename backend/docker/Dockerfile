# Use Node 18 base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json from the root (adjust path)
COPY ../package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app from root into /app
COPY ../ ./

# Make sure start.sh is executable (assumes it's in the root)
RUN chmod +x start.sh

# Start the app
CMD ["./start.sh"]
