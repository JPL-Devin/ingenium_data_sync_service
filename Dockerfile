# Use the official Node.js image as the base image
FROM node:22.14.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code into the container
COPY . .

# Start the application
CMD ["npm", "start"]
