'use strict';

var lodash = require('lodash');
var underscore = require('underscore');

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
                        "objetoAprendizagemParente": {
                            "titulo": "Medidas de peso",
                            "descricao": "Você vai compreender quilograma e quilo como medidas de peso.INDEX  MAT1ALPAC3OE1",
                            "videoId": "ZIPPvr3pARk",
                            "duracao": "07:15",
                            "imagemUrl": "https://i.ytimg.com/vi/ZIPPvr3pARk/mqdefault.jpg",
                            "dtCriacao": "2017-01-27T20:07:53.000Z",
                            "dtAtualizacao": "2017-02-17T22:44:33.000Z",
                            "dtRemocao": null,
                            "id": 63,
                            "objetoAprendizagemTipoId": 1,
                            "objetoAprendizagemStatusId": 1,
                            "objetoAprendizagemMidiaId": 4,
                            "objetoAprendizagemTipo": {
                                "nome": "Elemento Educacional",
                                "id": 1
                            },
                            "objetoAprendizagemStatus": {
                                "nome": "Enviado",
                                "id": 1
                            },
                            "objetoAprendizagemMidia": {
                                "nome": "Vídeo",
                                "id": 4
                            },
                            "alternativas": []
                        }
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
            include: [{
                relation: 'objetoAprendizagemParente',
                scope: {
                    include: {
                        relation: 'agrupadors',
                        scope: {
                            has: 'objetoAprendizagemParente'
                        }
                    }
                }
            }],
            has: 'objetoAprendizagemParente'
        }
    }]
};

var RecursiveFilter = function () {};

RecursiveFilter.prototype.has = function(array, filter) {
    var $this = this;
    //Executa o filtro
    function executeFilter(json, filter) {
        var results;
        var result;
        if(lodash.isArray(json)) {
            results = lodash.remove(json, function(js) {
                if(lodash.isArray(filter)) {
                    filter.forEach(function(ft) {
                        console.log('json array e filter array', js, ft);
                    });
                } else {
                    return executeFilter(js, filter);
                }
            });
            return results.length === 0;
        } else {
            if(lodash.isArray(filter)) {
                //TODO Não entra aqui
                filter.forEach(function(ft) {
                    console.log('json object e filter array', json, ft);
                });
            } else {
                //Se tem o filtro has
                if (lodash.has(filter, 'has')) {
                    //Verifica se contém a propriedade desejada
                    result = lodash.has(json, filter.has);
                    if (result) {
                        //Se tem mais includes a percorrer
                        if(filter.include) {
                            if(lodash.isArray(json.include)) {
                                console.log("include array");
                            } else {
                                return executeFilter(json[filter.include.relation], filter.include.scope);
                            }
                        }
                        return true;
                    }
                    return false;
                }
                //Se o json é um object e o filter é um array
                if (lodash.isArray(filter.include)) {
                    //filter.include.forEach(function(ft) {
                    //    result = executeFilter(json, {include: ft});
                    //    if(!result) return false;
                    //});
                    results = lodash.remove(filter, function(ft) {
                        result = executeFilter(json, {include: ft});
                    });
                    return results.length === 0;
                }
                //Se o json é um object e o filter é um object
                return executeFilter(json[filter.include.relation], filter.include.scope);
            }
        }
    }
    //Remove o valor se não estiver de acordo com o filtro
    return lodash.remove(array, function (json) {
        return executeFilter(json, filter);
        //if (lodash.isArray(filter.include)) {
        //    var results = [];
        //    filter.include.forEach(function (include) {
        //        console.log(include);
        //        //var result = executeFilter(json, include);
        //        //results.push(result);
        //    });
        //    //Remove os duplicados
        //    lodash.uniq(results);
        //    //Se restou um, confere para ver ser vai remover
        //    if (results.length === 1) {
        //        return results.shift();
        //    }
        //    return true;
        //} else if (lodash.isObject(filter.include)) { console.log('object');
        //    //return executeFilter(json, filter.include);
        //} else {
        //    throw 'Sem suporte para o tipo ' + (typeof filter.include);
        //}
    });
};

var recursive = new RecursiveFilter();
var teste = recursive.has(json, filter);
console.log('------\n', 'Final: \n', teste);