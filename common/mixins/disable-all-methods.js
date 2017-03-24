/**
 * https://github.com/strongloop/loopback/issues/651#issuecomment-167111395
 *
 * "mixins":{
 *   "DisableAllMethods":{
 *     "expose":[
 *       "create",
 *       "upsert",
 *       "replaceOrCreate",
 *       "upsertWithWhere",
 *       "exists",
 *       "findById",
 *       "replaceById",
 *       "find",
 *       "findOne",
 *       "updateAll",
 *       "deleteById",
 *       "count",
 *       "updateAttributes",
 *       "createChangeStream"
 *     ]
 *   }
 * }
 */
'use strict';

module.exports = function(Model, options) {
  if (Model && Model.sharedClass) {
    var methodsToExpose = options.expose || [];
    var modelName = Model.sharedClass.name;
    var methods = Model.sharedClass.methods();
    var relationMethods = [];
    var hiddenMethods = [];
    try {
      Object.keys(Model.definition.settings.relations).forEach(function(relation) {
        relationMethods.push({name: '__findById__' + relation, isStatic: false});
        relationMethods.push({name: '__destroyById__' + relation, isStatic: false});
        relationMethods.push({name: '__updateById__' + relation, isStatic: false});
        relationMethods.push({name: '__exists__' + relation, isStatic: false});
        relationMethods.push({name: '__link__' + relation, isStatic: false});
        relationMethods.push({name: '__get__' + relation, isStatic: false});
        relationMethods.push({name: '__create__' + relation, isStatic: false});
        relationMethods.push({name: '__update__' + relation, isStatic: false});
        relationMethods.push({name: '__destroy__' + relation, isStatic: false});
        relationMethods.push({name: '__unlink__' + relation, isStatic: false});
        relationMethods.push({name: '__count__' + relation, isStatic: false});
        relationMethods.push({name: '__delete__' + relation, isStatic: false});
      });
    } catch (err) {}
    methods.concat(relationMethods).forEach(function(method) {
      var methodName = method.name;
      if (methodsToExpose.indexOf(methodName) < 0) {
        hiddenMethods.push(methodName);
        Model.disableRemoteMethod(methodName, method.isStatic);
      }
    });
    //Exibe as tags dos endpoints
    if (hiddenMethods.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('\nMétodos remotos escondidos para', modelName, ':', hiddenMethods.join(', '), '\n');
    }
  }
};
