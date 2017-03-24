'use strict';

module.exports = function(Usuario) {

  var req;
  var res;
  /**
   * Obtêm o request e response da requisição.
   */
  Usuario.beforeRemote('**', function(ctx, modelInstance, next) {
    req = ctx.req;
    res = ctx.res;
    next();
  });

  /**
   * Altera a inserção dos dados do usuário com os dados do endereço.
   */
  Usuario.once('attached', function() {
    //Obtêm a fução sem alteração
    var override = Usuario.create;
    //Sobrescreve a função
    Usuario.create = function(data, cb) {
      var $this = this;
      //Valida se enviou o endereço
      if (data.endereco) {
        //Inicia uma transação
        var psTransation = Usuario.beginTransaction({
          isolationLevel: Usuario.Transaction.READ_COMMITTED,
          timeout: 30000,
        });
        psTransation.then(function(tx) {
          //Observa se a transação demorou mais que o esperado
          tx.observe('timeout', function(context, next) {
            try {
              cb('Timeout transaction');
            } catch (err) {
              //Não é necessário tratar
            }
            next();
          });
          //Insere o endereço
          var psCreateEndereco = Usuario.app.models.Endereco.create(data.endereco, {transaction: tx});
          psCreateEndereco.then(function(endereco) {
            data.enderecoId = endereco.id;
            //Insere um grupo de cartões acessados
            var psCreateUsuario = override.apply($this, [data, {transaction: tx}]);
            psCreateUsuario.then(function(usuario) {
              //Faz o commit da transação
              tx.commit(function(err) {
                if (err) return cb(err);
                cb(null, usuario);
              });
            });
            psCreateUsuario.catch(function(err) {
              //Faz o rollback da transação
              tx.rollback();
              cb(err);
            });
          });
          psCreateEndereco.catch(cb);
        });
        psTransation.catch(cb);
      } else {
        override.apply($this, [data, cb]);
      }
    };
  });

  /**
   * Altera a atualização dos dados do usuário com os dados do endereço.
   */
  Usuario.once('attached', function() {
    //Obtêm a fução sem alteração
    var override = Usuario.prototype.updateAttributes;
    //Sobrescreve a função
    Usuario.prototype.updateAttributes = function (data, cb) {
      var $this = this;
      //Valida se enviou o endereço
      if (data.endereco) {
        //Inicia uma transação
        var psTransation = Usuario.beginTransaction({
          isolationLevel: Usuario.Transaction.READ_COMMITTED,
          timeout: 30000,
        });
        psTransation.then(function(tx) {
          //Observa se a transação demorou mais que o esperado
          tx.observe('timeout', function (context, next) {
            try {
              cb('Timeout transaction');
            } catch (err) {
              //Não é necessário tratar
            }
            next();
          });
          //Insere o endereço
          var psSaveEndereco = Usuario.app.models.Endereco.upsert(data.endereco, {transaction: tx});
          psSaveEndereco.then(function (endereco) {
            data.enderecoId = endereco.id;
            //Insere um grupo de cartões acessados
            var psUpdateUsuario = override.apply($this, [data, {transaction: tx}]);
            psUpdateUsuario.then(function (usuario) {
              //Faz o commit da transação
              tx.commit(function (err) {
                if (err) return cb(err);
                cb(null, usuario);
              });
            });
            psUpdateUsuario.catch(function (err) {
              //Faz o rollback da transação
              tx.rollback();
              cb(err);
            });
          });
          psSaveEndereco.catch(cb);
        });
        psTransation.catch(cb);
      } else {
        override.apply($this, [data, cb]);
      }
    };
  });
  //Executa o envio de e-mail após inserir os dados
  Usuario.afterRemote('create', function(ctx, remoteMethodOutput, next) {
    /**
     * TODO Criar o e-mail.
     */
    //Envia o e-mail de boas vindas
    //emailSend.enviarEmailBoasVindas(Usuario, remoteMethodOutput);
    next();
  });
  //Executa a inserção do acesso do usuário ao sistema
  Usuario.afterRemote('login', function(ctx, remoteMethodOutput, next) {
    Usuario.app.models.UsuarioAcesso.create({
      navegador: ctx.req.headers['user-agent'],
      dtCriacao: new Date(),
      usuarioId: remoteMethodOutput.userId,
    }, function(err) {
      if (err) return logger.error(err);
      /**
       * TODO Imprimir log
       */
      //return logger.info('Registro da acesso do usuário inserido.');
    });
    next();
  });

  /**
   * Faz o upload da imagem do perfil.
   *
   * @param cb
   */
  Usuario.upload = function(cb) {
    //Permite somente imagens deste tipo
    Usuario.app.dataSources.storage.connector.allowedContentTypes = [
      'image/jpg', 'image/jpeg', 'image/png', 'image/svg+xml',
    ];
    Usuario.app.dataSources.storage.connector.maxFileSize = 1 * 1024 * 1024; //1 mb
    Usuario.app.dataSources.storage.connector.getFilename = function(fileInfo) {
      /**
       * Verifica se o nome do arquivo é aceitável e único.
       * @param {Object} fileInfo
       * @returns {String}
       */
      function verifFileName(fileInfo) {
        //Obtêm a extensão do arquivo
        var extension = fileInfo.name.substr(fileInfo.name.lastIndexOf('.'));
        //Ajusta o nome da imagem
        var fileName = 'image-' + new Date().getTime() + extension;
        //Se existir um arquivo com o mesmo nome
        if (fs.existsSync (fileName)) {
          return verifFileName (fileName);
        }
        return fileName;
      }
      return verifFileName(fileInfo);
    };
    //Adiciona a pasta padrão
    req.params = {
      container: 'perfil',
    };
    //Faz o upload do arquivo
    Usuario.app.models.Recipiente.upload(req, res, cb);
  };

  Usuario.remoteMethod(
    'upload', {
      description: 'Faz o upload da imagem do perfil.',
      http: {
        path: '/upload',
        verb: 'post',
      },
      returns: {
        type: 'object',
        root: true,
      },
    }
  );

  /**
   * Obtêm o request e response da requisição.
   */
  Usuario.beforeRemote('download', function(ctx, modelInstance, next) {
    req = ctx.req;
    res = ctx.res;
    next();
  });

  /**
   * Faz o download da imagem do perfil.
   *
   * @param file
   * @param cb
   */
  Usuario.download = function(file, cb) {
    //Adiciona a pasta padrão
    var container = 'perfil';
    //Faz o upload do arquivo
    Usuario.app.models.Recipiente.download(container, file, req, res, cb);
  };

  Usuario.remoteMethod(
    'download', {
      description: 'Faz o download da imagem do perfil.',
      http: {
        path: '/download/:file',
        verb: 'get',
      },
      accepts: [{
        arg: 'file',
        type: 'string',
        required: true,
      }],
    }
  );

  /**
   * Envia um e-mail para o usuário que deseja recuperar a senha.
   */
  Usuario.on('resetPasswordRequest', function(info) {
    /**
     * TODO Criar o e-mail.
     */
    //Envia o e-mail recuperação de senha
    //emailSend.enviarEmailRecuperarSenha(Usuario, info);
  });

  /**
   * Altera a senha do usuário.
   *
   * @param password
   * @param confirmation
   * @param cb
   */
  Usuario.updatePassword = function(password, confirmation, cb) {
    //Se não enviou um access_token
    if (!req.accessToken) {
      /**
       * TODO Configurar os erros
       */
      //Cria o objeto de erro e lança
      //errorHandle.errorUnAuthorization();
    }
    //Verifica se foi infirmado uma senha e se ela não é diference da confirmação de senha
    if (!password || !confirmation || password !== confirmation) {
      /**
       * TODO Configurar os erros
       */
      //Cria o objeto de erro e lança
      //errorHandle.errorHandle('Os parametros password e confirmation devem ser iguais.', 412);
    }
    //Consulta o usuário do ID e altera a sua senha
    Usuario.findById(req.accessToken.userId, function(err, usuario) {
      if (err) return cb(err);
      usuario.updateAttribute('password', password, cb);
    });
  };

  Usuario.remoteMethod(
    'updatePassword', {
      description: 'Altera a senha do usuário.',
      http: {
        path: '/update-password',
        verb: 'post',
      },
      accepts: [{
        arg: 'password',
        type: 'string',
        required: true,
      }, {
        arg: 'confirmation',
        type: 'string',
        required: true,
      }],
    }
  );
};