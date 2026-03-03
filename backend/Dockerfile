# ============================================
# Production Stage
# ============================================
FROM node:20.18.3-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Improve npm stability for slow network environments (even if just for Prisma)
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=600000
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=100000
ENV NPM_CONFIG_FETCH_RETRIES=10

# Copy package files
COPY package*.json ./

# Copy pre-built application from host
COPY dist ./dist
COPY node_modules ./node_modules
COPY prisma ./prisma

# Ensure Prisma client is regenerated for target OS
RUN npx prisma generate

# Create uploads directory with proper permissions
RUN mkdir -p ./uploads/videos && chown -R nodejs:nodejs ./uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
