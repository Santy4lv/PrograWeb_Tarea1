# ----------------------------------------------------
# Stage 1: Build and package JAR
# ----------------------------------------------------
FROM eclipse-temurin:27-jdk AS builder
WORKDIR /app

# Copy Maven wrapper and project descriptor
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Grant execution permissions to mvnw (required for Linux/Docker environments)
RUN chmod +x mvnw

# Download dependencies to leverage Docker layer caching
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production .jar artifact
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# ----------------------------------------------------
# Stage 2: Lightweight runtime environment
# ----------------------------------------------------
FROM eclipse-temurin:27-jre
WORKDIR /app

# Copy compiled JAR artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose default Spring Boot application port
EXPOSE 8080

# Memory tuning ensuring garbage collector respects AWS EC2 resource constraints
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

