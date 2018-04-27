/**
 * Created by konrad.sobon on 2018-04-26.
 */
angular.module('MissionControlApp').factory('ModelsFactory', ModelsFactory);

function ModelsFactory($http){
    return {
        updateFilePath: function updateFilePath(id, data){
            return $http.put('/api/v1/models/' + id + '/updatefilepath', data).then(complete).catch(failed);
        },

        getModelStats: function getModelStats(data) {
            return $http.post('/api/v1/models/modelstats', data).then(complete).catch(failed);
        }
    };

    function complete(response) {
        return response;
    }

    function failed(error) {
        console.log(error.statusText);
    }
}