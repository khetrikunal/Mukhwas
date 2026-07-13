@echo off
echo Starting Royal Mukhwas Backend...
set "PATH=D:\SchoolErp\apache-maven-3.9.16\bin;%PATH%"
set "DB_PASSWORD=vegeta@123"
cd backend
mvn spring-boot:run 2>&1