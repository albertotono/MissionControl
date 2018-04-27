/**
 * @param {{logid:string}} HTTP request argument for session info update.
 */
/**
 * @param {{centralpath:string}}
 */
/**
 * @param {{familiesid:string}}
 */
var mongoose = require('mongoose');
var HealthRecords = mongoose.model('HealthRecords');
var global = require('./socket/global');

module.exports.findAll = function(req, res){
    HealthRecords
        .find()
        .exec(function(err, data){
            if(err){
                res
                    .status(500)
                    .json(err);
            } else {
                res
                    .json(data)
            }
        });
};

/**
 * Retrieves health record by id.
 * @param req
 * @param res
 */
module.exports.findById = function(req, res){
    var id = req.params.id;
    HealthRecords
        .findOne({ '_id': id },function(err, result) {
            var response = {
                status: 200,
                message: result
            };
            if(err){
                response.status = 500;
                response.message = err;
            } else if(!result){
                console.log("Id was not found.");
            }
            res.status(response.status).json(response.message);
    });
};

/**
 * Returns Health Record collection that matches given central Path.
 * @param req
 * @param res
 */
module.exports.findByCentralPath = function (req, res) {
    // (Konrad) Since we cannot pass file path with "\" they were replaced with illegal pipe char "|".
    // (Konrad) RSN and A360 paths will have forward slashes instead of back slashes.
    var rgx;
    if(req.params.uri.includes('RSN:') || req.params.uri.includes('BIM 360:')){
        rgx = req.params.uri.replace(/\|/g, "/").toLowerCase();
    } else {
        rgx = req.params.uri.replace(/\|/g, "\\").toLowerCase();
    }
    HealthRecords
        .find(
            {"centralPath": rgx}, function (err, result) {
                var response = {
                    status: 200,
                    message: result
                };
                if(err){
                    response.status = 500;
                    response.message = err;
                } else if(!result){
                    console.log("File Path wasn't found in any Health Records Collections.");
                }
                res.status(response.status).json(response.message);
            }
        )
};

module.exports.add = function(req, res){
    HealthRecords
        .create(req.body, function(err, healthrecord){
            if(err) {
                res
                    .status(400)
                    .json(err);
            } else {
                global.io.sockets.emit('add_healthrecord', req.body);
                res
                    .status(201)
                    .json(healthrecord);
            }
        });
};

var _addFamilyStats = function (req, res, healthReportData){
    healthReportData.familyStats.push({
        suspectFamilies: req.body.suspectFamilies,
        totalFamilies: parseInt(req.body.totalFamilies, 10),
        unusedFamilies: parseInt(req.body.unusedFamilies, 10),
        inPlaceFamilies: parseInt(req.body.inPlaceFamilies, 10),
        oversizedFamilies: parseInt(req.body.oversizedFamilies, 10),
        createdBy: req.body.createdBy,
        createdOn: Date.now()
    });

    healthReportData.save(function (err, dataUpdated) {
        if(err){
            res
                .status(500)
                .json(err);
        } else {
            res
                .status(200)
                .json(dataUpdated.familyStats[dataUpdated.familyStats.length - 1]);
        }
    });
};

module.exports.postFamilyStats = function (req, res) {
    var id = req.params.id;
    HealthRecords
        .findById(id)
        .select('familyStats')
        .exec(function (err, doc){
            var response = {
                status: 200,
                message: []
            };
            if (err){
                response.status = 500;
                response.message = err;
            } else if(!doc){
                response.status = 404;
                response.message = {"message": "Workset Id not found."}
            }
            if(doc){
                _addFamilyStats(req, res, doc);
            } else {
                res
                    .status(response.status)
                    .json(response.message);
            }
        });
};

/**
 *
 * @param req
 * @param res
 */
module.exports.getWorksetStats = function (req, res) {
    var id = mongoose.Types.ObjectId(req.params.id);
    var from = new Date(req.query.from);
    var to = new Date(req.query.to);
    HealthRecords
        .aggregate([
            { $match: { _id: id }},
            { $project: {
                'onOpened': { $filter: {
                    input: '$onOpened',
                    as: 'item',
                    cond: { $and: [
                        { $gte: ['$$item.createdOn', from]},
                        { $lte: ['$$item.createdOn', to]}
                    ]}
                }},
                'onSynched': { $filter: {
                    input: '$onSynched',
                    as: 'item',
                    cond: { $and: [
                        { $gte: ['$$item.createdOn', from]},
                        { $lte: ['$$item.createdOn', to]}
                    ]}
                }},
                'itemCount': { $slice: ['$itemCount', -1]}
            }}]
        ).exec(function (err, response){
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
        });
};

/**
 *
 * @param req
 * @param res
 */
module.exports.getViewStats = function (req, res) {
    var id = mongoose.Types.ObjectId(req.params.id);
    var from = new Date(req.query.from);
    var to = new Date(req.query.to);
    HealthRecords
        .aggregate([
            { $match: { _id: id }},
            { $project: {
                'viewStats': { $filter: {
                    input: '$viewStats',
                    as: 'item',
                    cond: { $and: [
                        { $gte: ['$$item.createdOn', from]},
                        { $lte: ['$$item.createdOn', to]}
                    ]}
                }}
            }}]
        ).exec(function (err, response){
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
        });
};



/**
 * Retrieves latest entry in the Link Stats array.
 * @param req
 * @param res
 */
module.exports.getLinkStats = function (req, res) {
    var id = mongoose.Types.ObjectId(req.params.id);
    var from = new Date(req.query.from);
    var to = new Date(req.query.to);
    HealthRecords
        .aggregate([
            { $match: { _id: id }},
            { $project: {
                'linkStats': { $filter: {
                    input: '$linkStats',
                    as: 'item',
                    cond: { $and: [
                        { $gte: ['$$item.createdOn', from]},
                        { $lte: ['$$item.createdOn', to]}
                    ]}
                }}
            }}]
        ).exec(function (err, response){
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
        });
};



/**
 * Retrieves all user names from openTimes data.
 * This is useful to find out all users that were in the model.
 * @param req
 * @param res
 */
module.exports.getUserNamesByCentralPath = function (req, res) {
    // (Konrad) Since we cannot pass file path with "\" they were replaced with illegal pipe char "|".
    // (Konrad) RSN and A360 paths will have forward slashes instead of back slashes.
    var rgx;
    if(req.params.uri.includes('RSN:') || req.params.uri.includes('BIM 360:')){
        rgx = req.params.uri.replace(/\|/g, "/").toLowerCase();
    } else {
        rgx = req.params.uri.replace(/\|/g, "\\").toLowerCase();
    }
    HealthRecords
        .find(
            {"centralPath": rgx}, {'openTimes.user': 1}, function (err, result) {
                var response = {
                    status: 200,
                    message: result
                };
                if(err){
                    response.status = 500;
                    response.message = err;
                } else if(!result){
                    console.log("File Path wasn't found in any Health Records Collections.");
                }
                res.status(response.status).json(response.message);
            }
        )
};



/**
 * Updates stored file path when Configuration is changed.
 * @param req
 * @param res
 */
module.exports.updateFilePath = function (req, res) {
    var before = req.body.before.replace(/\\/g, "\\").toLowerCase();
    var after = req.body.after.replace(/\\/g, "\\").toLowerCase();
    HealthRecords
        .update(
            {'centralPath': before},
            {'$set': {'centralPath' : after}}, function (err, result) {
                var response = {
                    status: 200,
                    message: result
                };
                if(err){
                    response.status = 500;
                    response.message = err;
                } else if(!result){
                    console.log("File Path wasn't found in any Configurations Collections");
                }
                res.status(response.status).json(response.message);
            }
        );
};
