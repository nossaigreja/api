# ##############################################################
# Define a imagem do Docker com todas as dependência necessárias
# ##############################################################
#
# sudo docker build -t nossaigreja:1.0 .
# sudo docker run -dit -p 3000:3000 --name my-container -v /path/to/nossaigreja-api:/var/www/api -w /var/www/api /bin/bash
#
# - Em caso de erro na criação da tag no comando docker build (Tive problemas no Windows 10), siga:
#
# sudo docker images
# sudo docker tag <ID_IMAGE> nossaigreja:1.0
# sudo docker run <...> (Conforme acima)
#
# - Acessar a máquina com bash:
#
# sudo docker exec -it my-container bash

FROM ubuntu:16.04

# Define o autor da imagem
LABEL authors="Herberts Cruz <herbertscruz@gmail.com>"

RUN apt-get update && apt-get install -y nodejs nodejs-legacy npm && npm install -g pm2

#########################################################################
# Instala os pacotes essenciais para DEV (Descomente se precisar)
#########################################################################
# RUN apt-get update && apt-get install -y vim git curl wget

# Porta(s) padrão liberadas para fora
EXPOSE 3000 443 80 22