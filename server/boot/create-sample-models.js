'use strict';

require('rootpath')();

var fs = require('fs');
var path = require('path');
var upperCamelCase = require('uppercamelcase');

module.exports = function(app) {
    //Adiciona o diretório das amostras
  var pathDir = path.join('server', 'samples');
    //Lê todos os arquivos do diretório
  fs.readdir(pathDir, function(err, files) {
    if (err) throw err;
        //Navega nos arquivos do diretório
    for (var i in files) {
      if (typeof files[i] === 'string') {
                //Se for um arquivo do tipo JSON
        if (path.extname(files[i]) === '.json') {
                    //Obtêm o path do arquivo
          var filename = path.join(pathDir, path.basename(files[i]));
                    //Obtêm o nome do modelo
          var modelName = upperCamelCase(path.basename(files[i], '.json'));
                    //Cria a tabela e a popula com os dados do arquivo
          _create(app, filename, modelName);
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
 * @param modelName
 * @private
 */
function _create(app, filename, modelName) {
    //Inicia o processo importação da massa de dados
  app.dataSources.db.automigrate(modelName, function(err) {
    if (err) throw err;
        //Lê o arquivo json
    var json = require(filename);
        //Adiciona os dados na base de dados
    app.models[modelName].create(json, function(err, data) {
      if (err) throw err;
      console.log('O modelo ' + modelName + ' foi criado com os dados: \n', data);
            //Navega nos dados retornados
      for (var i in data) {
        if (typeof data[i] === 'object') {
                //Obtêm a instância do objeto
          app.models[modelName].findById(data[i].id, function(err, model) {
            if (err) throw err;
                  //Obtêm os relacionamento do modelo
            var relations = app.models[modelName].definition.settings.relations;
            for (var r in relations) {
              if (typeof relations[r] === 'object') {
                switch (relations[r].type) {
                  case 'hasAndBelongsToMany':
                    for (var j in json) {
                      if (typeof json[j] === 'object') {
                        if (json[j][r]) {
                          var relationNameModel = relations[r].model;
                                  //Tenta inserir os dados do relacionamento
                          _createRelation(model, r, relationNameModel, json[j][r]);
                        }
                      }
                    }
                    break;
                }
              }
            }
          });
        }
      }
    });
  });
}

/**
 * Cria a tabela e a popula com os dados do arquivo para o relacionamento.
 *
 * @param model
 * @param relationName
 * @param relationNameModel
 * @param data
 * @private
 */
function _createRelation(model, relationName, relationNameModel, data) {
  //Tenta inserir os dados do relacionamento
  model[relationName].create(data, function(err, relation) {
    if (err) throw err;
    console.log('O modelo ' + relationNameModel + ' foi criado com os dados: \n', relation);
  });
}
