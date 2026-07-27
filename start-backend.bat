@echo off
echo Starting Royal Mukhwas Backend...
set "PATH=D:\SchoolErp\apache-maven-3.9.16\bin;%PATH%"
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=royalmukhwas"
set "DB_USER=postgres"
set "DB_PASSWORD=2504"
cd backend
mvn spring-boot:run 2>&1
