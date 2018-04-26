/**
 * Created by konrad.sobon on 2018-04-24.
 */
var mongoose = require('mongoose');
var Models = mongoose.model('Models');

ModelsService = {
    /**
     * Finds Worksets collection by central path.
     * @param req
     * @param res
     */
    findByCentralPath: function(req, res){
        // (Konrad) Since we cannot pass file path with "\" they were replaced with illegal pipe char "|".
        // (Konrad) RSN and BIM 360 paths will have forward slashes instead of back slashes.
        var rgx;
        if(req.params.uri.includes('RSN:') || req.params.uri.includes('BIM 360:')){
            rgx = req.params.uri.replace(/\|/g, "/").toLowerCase();
        } else {
            rgx = req.params.uri.replace(/\|/g, "\\").toLowerCase();
        }
        Models
            .find(
                { "centralPath": rgx }, function (err, response){
                    var result = {
                        status: 200,
                        message: response
                    };
                    if (err){
                        result.status = 500;
                        result.message = err;
                    } else if (!response){
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
                })
    },

    /**
     *
     * @param req
     * @param res
     */
    add: function(req, res){
        Models
            .create(req.body, function (err, response){
                var result = {
                    status: 201,
                    message: response
                };
                if (err){
                    result.status = 500;
                    result.message = err;
                } else if (!response){
                    result.status = 404;
                    result.message = err;
                }
                res.status(result.status).json(result.message);
            });
    },

    /**
     * Posts model open times to Health Recors.
     * @param req
     * @param res
     */
    postModelSize: function (req, res) {
        var id = req.params.id;
        Models
            .update(
                { '_id': id },
                { '$push': { 'modelSizes': req.body }}, function (err, response){
                    var result = {
                        status: 201,
                        message: response
                    };
                    if (err){
                        result.status = 500;
                        result.message = err;
                    } else if (!response){
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
                });
    },

    /**
     * Posts model open times to Health Record.
     * @param req
     * @param res
     */
    postModelOpenTime: function (req, res) {
        var id = req.params.id;
        Models
            .update(
                {'_id': id},
                {'$push': {'openTimes': req.body}}, function (err, response){
                    var result = {
                        status: 201,
                        message: response
                    };
                    if (err){
                        result.status = 500;
                        result.message = err;
                    } else if (!response){
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
                });
    },

    /**
     * Posts model synch time to Health Report.
     * @param req
     * @param res
     */
    postModelSynchTime: function (req, res) {
        var id = req.params.id;
        Models
            .update(
                {'_id': id},
                {'$push': {'synchTimes': req.body}}, function (err, response){
                    var result = {
                        status: 201,
                        message: response
                    };
                    if (err){
                        result.status = 500;
                        result.message = err;
                    } else if (!response){
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
                });
    },

    /**
     * Updates the centralPath value. Used by the Configurations tool.
     * @param req
     * @param res
     */
    updateFilePath: function (req, res) {
        var before = req.body.before.replace(/\\/g, "\\").toLowerCase();
        var after = req.body.after.replace(/\\/g, "\\").toLowerCase();
        Models
            .update(
                { 'centralPath': before },
                { '$set': { 'centralPath' : after }}, function (err, response){
                    var result = {
                        status: 201,
                        message: response
                    };
                    if (err){
                        result.status = 500;
                        result.message = err;
                    } else if (!response){
                        result.status = 404;
                        result.message = err;
                    }
                    res.status(result.status).json(result.message);
                });
    }
};

module.exports = ModelsService;