'use strict';

require('rootpath')();

var fs = require('fs');
var path = require("path");
var upperCamelCase = require('uppercamelcase');

module.exports = function (app) {
    //Adiciona o diretório das amostras
    var pathDir = path.join('server', 'samples');
    //Lê todos os arquivos do diretório
    fs.readdir(pathDir, function (err, files) {
        if (err) throw err;
        //Navega nos arquivos do diretório
        for (var i in files) {
            if (typeof files[i] === 'string') {
                //Se for um arquivo do tipo JSON
                if (path.extname(files[i]) === '.json') {
                    //Obtêm o path do arquivo
                    var filename = path.join(pathDir, path.basename(files[i]));
                    //Obtêm o nome do modelo
                    var modelname = upperCamelCase(path.basename(files[i], '.json'));
                    //Cria a tabela e a popula com os dados do arquivo
                    _create(app, filename, modelname);
                }
            }
        }
    });
};

/**
 * Cria a tabela e a popula com os dados do arquivo.
 *
 * @param app
 * @param filename
 * @param modelname
 * @private
 */
function _create (app, filename, modelname) {
    //Inicia o processo importação da massa de dados
    app.dataSources.db.automigrate(modelname, function (err) {
        if (err) throw err;
        //Lê o arquivo json
        var json = require(filename);
        //Adiciona os dados na base de dados
        app.models[modelname].create(json, function (err, model) {
            if (err) throw err;
            console.log('O modelo ' + modelname + ' foi criado com os dados: \n', model);

            var relations = app.models[modelname].definition.settings.relations;

            for (var r in relations) {
                if (typeof relations[r] === 'object') {
                    switch (relations[r].type) {
                        case 'hasAndBelongsToMany':
                    /**
                     * TODO Ver como inserir o relacionamento N:N
                     */
                            //var relationModel = relations[r].model;
                            //
                            //app.models[relationModel].create(json[r], function (err, relation) {
                            //    if (err) throw err;
                            //
                            //    console.log('O modelo ' + relationModel + ' foi criado com os dados: \n', relation);
                            //});
                            break;
                    }
                }
            }
        });
    });
}