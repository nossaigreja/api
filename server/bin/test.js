'use strict';

var lodash = require('lodash');

//var test = [1, 1, 2];
//
//console.log(lodash.uniq(test));

var json = [{
    "titulo": "Medidas de peso",
    "descricao": "Você vai compreender quilograma e quilo como medidas de peso.INDEX  MAT1ALPAC3OE1",
    "videoId": null,
    "duracao": null,
    "imagemUrl": "https://i.ytimg.com/vi/ZIPPvr3pARk/mqdefault.jpg",
    "id": 511,
    "objetoAprendizagemTipoId": 3,
    "objetoAprendizagemStatusId": 3,
    "objetoAprendizagemMidiaId": 4,
    "objetoAprendizagemTipo": {
        "nome": "Objeto Educacional",
        "id": 3
    },
    "objetoAprendizagemStatus": {
        "nome": "Publicado",
        "id": 3
    },
    "objetoAprendizagemMidia": {
        "nome": "Vídeo",
        "id": 4
    },
    "tags": [
        {
            "nome": "Unidades de medida",
            "ativo": true,
            "id": 18
        },
        {
            "nome": "Matemática",
            "ativo": true,
            "id": 26
        }
    ],
    "agrupadors": [
        {
            "ordem": null,
            "id": 367,
            "objetoAprendizagemPaiId": 511,
            "objetoAprendizagemParenteId": 369,
            "objetoAprendizagemParente": {
                "titulo": "Medidas de peso",
                "descricao": "Você vai compreender quilograma e quilo como medidas de peso.INDEX  MAT1ALPAC3OE1",
                "videoId": null,
                "duracao": null,
                "imagemUrl": "https://i.ytimg.com/vi/ZIPPvr3pARk/mqdefault.jpg",
                "dtCriacao": "2017-01-27T20:07:53.000Z",
                "dtAtualizacao": "2017-02-17T22:44:33.000Z",
                "dtRemocao": null,
                "id": 369,
                "objetoAprendizagemTipoId": 2,
                "objetoAprendizagemStatusId": 3,
                "objetoAprendizagemMidiaId": 4,
                "objetoAprendizagemTipo": {
                    "nome": "Objeto Informacional",
                    "id": 2
                },
                "objetoAprendizagemStatus": {
                    "nome": "Publicado",
                    "id": 3
                },
                "objetoAprendizagemMidia": {
                    "nome": "Vídeo",
                    "id": 4
                },
                "agrupadors": [
                    {
                        "ordem": null,
                        "id": 225,
                        "objetoAprendizagemPaiId": 369,
                        "objetoAprendizagemParenteId": 63,
                        //"objetoAprendizagemParente": {
                        //    "titulo": "Medidas de peso",
                        //    "descricao": "Você vai compreender quilograma e quilo como medidas de peso.INDEX  MAT1ALPAC3OE1",
                        //    "videoId": "ZIPPvr3pARk",
                        //    "duracao": "07:15",
                        //    "imagemUrl": "https://i.ytimg.com/vi/ZIPPvr3pARk/mqdefault.jpg",
                        //    "dtCriacao": "2017-01-27T20:07:53.000Z",
                        //    "dtAtualizacao": "2017-02-17T22:44:33.000Z",
                        //    "dtRemocao": null,
                        //    "id": 63,
                        //    "objetoAprendizagemTipoId": 1,
                        //    "objetoAprendizagemStatusId": 1,
                        //    "objetoAprendizagemMidiaId": 4,
                        //    "objetoAprendizagemTipo": {
                        //        "nome": "Elemento Educacional",
                        //        "id": 1
                        //    },
                        //    "objetoAprendizagemStatus": {
                        //        "nome": "Enviado",
                        //        "id": 1
                        //    },
                        //    "objetoAprendizagemMidia": {
                        //        "nome": "Vídeo",
                        //        "id": 4
                        //    },
                        //    "alternativas": []
                        //}
                    }
                ]
            }
        }
    ]
}];

var filter = {
    include: [{
        relation: 'agrupadors',
        scope: {
            include: {
                relation: 'objetoAprendizagemParente',
                scope: {
                    include: {
                        relation: 'agrupadors',
                        scope: {
                            contains: 'objetoAprendizagemParente'
                        }
                    }
                }
            },
            contains: 'objetoAprendizagemParente'
        }
    }]
};

var RecursiveFilter = function () {};

RecursiveFilter.prototype.contains = function(array, filter) {
    var $this = this;
    //Executa o filtro
    function executeFilter(json, filter) {
        var jsonRelation;
        var results;
        var result;
        if (filter.scope) {
            var contains = filter.scope.contains;
            if (contains) {
                jsonRelation = json[filter.relation];
                if (lodash.isArray(jsonRelation)) {
                    results = [];
                    jsonRelation.forEach(function (item) {
                        result = (item[contains]) ? true : false;
                        results.push(result);
                    });
                    //Remove os duplicados
                    lodash.uniq(results);
                    //Se restou um, confere para ver ser vai remover
                    if (results.length === 1) {
                        result = results.shift();
                        if (!result) return false;
                    }
                } else {
                    result = (json[filter.relation][contains]) ? true : false
                    if (!result) return false;
                }
            }
            if (filter.scope.include) {
                jsonRelation = json[filter.relation];
                if (lodash.isArray(jsonRelation)) {
                    results = [];
                    jsonRelation.forEach(function (item) {
                        var result = executeFilter(item[filter.scope.include.relation], filter.scope.include);
                        results.push(result);
                    });
                    //Remove os duplicados
                    lodash.uniq(results);
                    //Se restou um, confere para ver ser vai remover
                    if (results.length === 1) {
                        return results.shift();
                    }
                } else {
                    return executeFilter(jsonRelation[filter.scope.include.relation], filter.scope);
                }
            }
        }
        return true;
    }
    //Remove o valor se não estiver de acordo com o filtro
    return lodash.remove(array, function (json) {
        if (lodash.isArray(filter.include)) {
            var results = [];
            filter.include.forEach(function (include) {
                var result = executeFilter(json, include);
                results.push(result);
            });
            //Remove os duplicados
            lodash.uniq(results);
            //Se restou um, confere para ver ser vai remover
            if (results.length === 1) {
                return results.shift();
            }
            return true;
        } else if (lodash.isObject(filter.include)) {
            return executeFilter(json, filter.include);
        } else {
            throw 'Sem suporte para o tipo ' + (typeof filter.include);
        }
    });
};

var recursive = new RecursiveFilter();
console.log(recursive.contains(json, filter));