'use strict';

require('rootpath')();

var ControlTransation = require('common/util/control-transaction.js');

module.exports = function (Usuario) {
    var req;
    var res;
    /**
     * Obtêm o request e response da requisição.
     */
    Usuario.beforeRemote('**', function (ctx, modelInstance, next) {
        req = ctx.req;
        res = ctx.res;
        next();
    });

    /**
     * Altera a inserção dos dados do usuário com os dados do endereço.
     */
    Usuario.once('attached', function () {
        //Obtêm a fução sem alteração
        var override = Usuario.create;
        //Sobrescreve a função
        Usuario.create = function () {
            var $this = this;
            var args = [].slice.apply(arguments);
            var $arguments = [].slice.apply(args);
            var data = args.shift();
            var cb = args.pop();
            cb = (typeof cb === 'function') ? cb : null;
            var hasOpenTransaction = false;
            var hasEnderecos = false;
            var hasTelefones = false;
            //Valida se enviou endereços
            if (data.enderecos) {
                //Se tem pelo menos um registro
                if (data.enderecos.length > 0) {
                    hasOpenTransaction = true;
                    hasEnderecos = true;
                }
            }
            //Valida se enviou telefones
            if (data.telefones) {
                //Se tem pelo menos um registro
                if (data.telefones.length > 0) {
                    hasOpenTransaction = true;
                    hasTelefones = true;
                }
            }
            //Se precisa abrir transação
            if(hasOpenTransaction) {
                var control = new ControlTransation(Usuario);
                var psTransation = control.beginTransaction();
                psTransation.then(function (tx) {
                    var config = control.getConfigTransaction(tx);
                    if (cb) {
                        $arguments.pop();
                    }
                    //Insere um grupo de cartões acessados
                    var psCreateUsuario = override.apply($this, $arguments);
                    psCreateUsuario.then(function (usuario) {
                        var promises = [];
                        if (hasEnderecos) {
                            var psCreateEndereco = usuario.enderecos.create(data.enderecos, config);
                            promises.push(psCreateEndereco);
                        }
                        if (hasTelefones) {
                            var psCreateTelefones = usuario.telefones.create(data.telefones, config);
                            promises.push(psCreateTelefones);
                        }
                        //Gerencia as promessas
                        var psAllPromises = Promise.all(promises);
                        psAllPromises.then(function() {
                            //Faz o commit da transação
                            control.commit(function (err) {
                                if (err) return cb(err);
                                cb(null, usuario);
                            });
                        });
                        psAllPromises.catch(function(err) {
                            //Faz o rollback da transação
                            control.rollback();
                            cb(err);
                        });
                    });
                    psCreateUsuario.catch(cb);
                });
                psTransation.catch(cb);
            } else {
                override.apply($this, $arguments);
            }
        };
    });

    /**
     * Altera a atualização dos dados do usuário com os dados do endereço.
     */
    Usuario.once('attached', function () {
        //Obtêm a fução sem alteração
        var override = Usuario.prototype.updateAttributes;
        //Sobrescreve a função
        Usuario.prototype.updateAttributes = function () {
            var $this = this;
            var args = [].slice.apply(arguments);
            var $arguments = [].slice.apply(args);
            var data = args.shift();
            var cb = args.pop();
            cb = (typeof cb === 'function') ? cb : null;
            var hasOpenTransaction = false;
            var hasEnderecos = false;
            var hasTelefones = false;
            //Valida se enviou endereços
            if (data.enderecos) {
                //Se tem pelo menos um registro
                if (data.enderecos.length > 0) {
                    hasOpenTransaction = true;
                    hasEnderecos = true;
                }
            }
            //Valida se enviou telefones
            if (data.telefones) {
                //Se tem pelo menos um registro
                if (data.telefones.length > 0) {
                    hasOpenTransaction = true;
                    hasTelefones = true;
                }
            }
            //Se precisa abrir transação
            if (hasOpenTransaction) {
                var control = new ControlTransation(Usuario);
                var psTransation = control.beginTransaction();
                psTransation.then(function (tx) {
                    var config = control.getConfigTransaction(tx);
                    if (cb) {
                        $arguments.pop();
                    }
                    //Insere um grupo de cartões acessados
                    var psUpdateUsuario = override.apply($this, $arguments);
                    psUpdateUsuario.then(function (usuario) {
                        var promises = [];
                        if (hasEnderecos) {
                            /**
                             * TODO Implementar merge do banco de dados com dados enviados.
                             */
                            //var psUpdateEndereco = usuario.enderecos.create(data.enderecos, config);
                            //promises.push(psUpdateEndereco);
                        }
                        if (hasTelefones) {
                            /**
                             * TODO Implementar merge do banco de dados com dados enviados.
                             */
                            //var psUpdateTelefones = usuario.telefones.create(data.telefones, config);
                            //promises.push(psUpdateTelefones);
                        }
                        //Gerencia as promessas
                        var psAllPromises = Promise.all(promises);
                        psAllPromises.then(function () {
                            //Faz o commit da transação
                            control.commit(function (err) {
                                if (err) return cb(err);
                                cb(null, usuario);
                            });
                        });
                        psAllPromises.catch(function (err) {
                            //Faz o rollback da transação
                            control.rollback();
                            cb(err);
                        });
                    });
                    psUpdateUsuario.catch(cb);
                });
                psTransation.catch(cb);
            } else {
                override.apply($this, $arguments);
            }
        };
    });
    //Executa o envio de e-mail após inserir os dados
    Usuario.afterRemote('create', function (ctx, remoteMethodOutput, next) {
        /**
         * TODO Criar o e-mail.
         */
            //Envia o e-mail de boas vindas
            //emailSend.enviarEmailBoasVindas(Usuario, remoteMethodOutput);
        next();
    });
    //Executa a inserção do acesso do usuário ao sistema
    Usuario.afterRemote('login', function (ctx, remoteMethodOutput, next) {
        Usuario.app.models.UsuarioAcesso.create({
            navegador: ctx.req.headers['user-agent'],
            dtCriacao: new Date(),
            usuarioId: remoteMethodOutput.userId,
        }, function (err) {
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
    Usuario.upload = function (cb) {
        //Permite somente imagens deste tipo
        Usuario.app.dataSources.storage.connector.allowedContentTypes = [
            'image/jpg', 'image/jpeg', 'image/png', 'image/svg+xml',
        ];
        Usuario.app.dataSources.storage.connector.maxFileSize = 1 * 1024 * 1024; //1 mb
        Usuario.app.dataSources.storage.connector.getFilename = function (fileInfo) {
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
                if (fs.existsSync(fileName)) {
                    return verifFileName(fileName);
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
    Usuario.beforeRemote('download', function (ctx, modelInstance, next) {
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
    Usuario.download = function (file, cb) {
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
    Usuario.on('resetPasswordRequest', function (info) {
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
    Usuario.updatePassword = function (password, confirmation, cb) {
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
        Usuario.findById(req.accessToken.userId, function (err, usuario) {
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

function beginTransaction(Usuario) {

}