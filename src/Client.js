var axios = require('axios') ;

var getTypeNamesFromCapabilities = require('./internal/getTypeNamesFromCapabilities');
var clq_filter = require('./internal/cql_filter')

var rp = function(options){
    var axiosOptions = {
        'params': options.qs,
        'headers': options.headers,
        'responseType': 'text'
    };
    if ( options.transform ){
        axiosOptions.transformResponse = [options.transform] ;
    }
    return axios.get(
        options.uri,
        axiosOptions
    ).then(function(response){
        return response.data;
    });
};

/**
 * @classdesc
 * WFS access client for the geoportal
 * @constructor
 * @param {string} apiKey - The Geoportal Key to use the Geoportal API
 * @param {string} headers - Headers for HTTP requests
 */
var Client = function(apiKey,headers){
    if (typeof apiKey === 'undefined' ) throw new Error('Required param: apiKey');
    this.apiKey = apiKey;
    this.headers = headers || {};
};

/**
 * Get WFS URL
 */
Client.prototype.getUrl = function(){
    return 'http://wxs.ign.fr/'+this.apiKey+'/geoportail/wfs';
};

/**
 * @private
 */
Client.prototype.getDefaultOptions = function() {
    return {
        uri: this.getUrl(),
        qs: {
            service: 'WFS',
            version: '2.0.0'
        },
        headers: this.headers
    };
};

/**
 * Get typenames according to apiKey
 */
Client.prototype.getTypeNames = function(){
    var options = this.getDefaultOptions();
    options.qs.request = 'GetCapabilities';
    options.transform = function(body){
        return getTypeNamesFromCapabilities(body);
    };
    return rp(options);
};

/**
 * Get features for a given type
 * @param {string} typeName - name of type
 * @param {Object} params - define cumulative filters (bbox, geom) and to manage the pagination
 */
Client.prototype.getFeatures = function(typeName, params){
    var params = params || {};

    var options = this.getDefaultOptions();
    options.qs.request  = 'GetFeature' ;
    options.qs.typename = typeName ;
    options.qs.outputFormat = 'application/json';
    options.qs.srsName = 'CRS:84';

    if ( typeof params._limit !== 'undefined' ){
        options.qs.count = parseInt(params._limit);
    }
    if ( typeof params._start !== 'undefined' ){
        options.qs.startIndex = parseInt(params._start);
    }

    options.transform = function(body){
        return JSON.parse(body);
    };

    /*
     * bbox and attribute filter
     */
    var cql_filter = clq_filter(params);
    if ( cql_filter !== null ){
        options.qs.cql_filter = cql_filter;
    }
    return rp(options);
};

module.exports = Client ;
