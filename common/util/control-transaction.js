'use strict';

/**
 * Cria um objeto de controle
 *
 * @type {ControlTransaction}
 */
module.exports = ControlTransaction;

/**
 * Controla de transações se o connector tiver suporte, caso ele não tenha, simula uma transação.
 *
 * @param Model
 * @constructor
 */
function ControlTransaction(Model) {
    this.model = Model;
    this._hasSupportTransation = false;
    this._transation = null;
}

/**
 * Abre uma transação se conector tiver suporte.
 *
 * @param {Function=} cb
 * @returns {Promise}
 */
ControlTransaction.prototype.beginTransaction = function(cb) {
    try {
        var config = {
            isolationLevel: this.model.Transaction.READ_COMMITTED,
            timeout: 30000,
        };
        //Caso queira uma callback
        if (cb) {
            this.model.beginTransaction(config, cb);
            //Marca que existe suporte à transação
            this._hasSupportTransation = true;
        } else {
            var psTransaction = this.model.beginTransaction(config);
            //Marca que existe suporte à transação
            this._hasSupportTransation = true;
            return psTransaction;
        }
    } catch(err) {
        //Caso queira uma callback
        if (cb) return cb();
        //Caso queira uma promise
        return new Promise(function(resolve) {
            resolve();
        });
    }
};

/**
 * Obtêm as configurações da transação se houver alguma aberta.
 *
 * @param {Object} transaction
 * @returns {Object}
 */
ControlTransaction.prototype.getConfigTransaction = function(transaction) {
    var config = {};
    if (this._hasSupportTransation) {
        //Observa se a transação demorou mais que o esperado
        transaction.observe('timeout', function (context, next) {
            try {
                cb('Timeout transaction');
            } catch (err) {
                //Não é necessário tratar
            }
            next();
        });
        this._transation = transaction;
        config = {transaction: transaction};
    }
    return config;
};

/**
 * Faz o commit dos dados em uma transação se estiver aberta.
 *
 * @param {Function=} cb
 * @returns {Promise}
 */
ControlTransaction.prototype.commit = function(cb) {
    if (this._hasSupportTransation) {
        //Caso queira uma callback
        if (cb) return this._transation.commit(cb);
        return this._transation.commit();
    } else {
        //Caso queira uma callback
        if (cb) return cb();
        //Caso queira uma promise
        return new Promise(function(resolve) {
            resolve();
        });
    }
};

/**
 * Faz o roolback dos dados em uma transação se estiver aberta.
 *
 * @param {Function=} cb
 * @returns {Promise}
 */
ControlTransaction.prototype.roolback = function(cb) {
    if (this._hasSupportTransation) {
        //Caso queira uma callback
        if (cb) return this._transation.roolback(cb);
        return this._transation.roolback();
    } else {
        //Caso queira uma callback
        if (cb) return cb();
        //Caso queira uma promise
        return new Promise(function(resolve) {
            resolve();
        });
    }
};