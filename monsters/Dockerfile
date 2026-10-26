# ----------------------------------------------------
# Etapa 1: Compilación y empaquetado del JAR
# ----------------------------------------------------
FROM eclipse-temurin:27-jdk AS builder
WORKDIR /app

# Copiar el wrapper de Maven y el descriptor del proyecto
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Dar permisos de ejecución a mvnw (crucial para entornos Linux/Docker)
RUN chmod +x mvnw

# Descargar dependencias para aprovechar la caché de capas de Docker
RUN ./mvnw dependency:go-offline -B || true

# Copiar el código fuente y construir el archivo .jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# ----------------------------------------------------
# Etapa 2: Entorno de ejecución ligero
# ----------------------------------------------------
FROM eclipse-temurin:27-jre
WORKDIR /app

# Copiar el JAR generado desde la etapa de compilación
COPY --from=builder /app/target/*.jar app.jar

# Exponer el puerto donde corre Spring Boot
EXPOSE 8080

# Ajuste de memoria para que el recolector de basura respete los límites de AWS EC2
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
