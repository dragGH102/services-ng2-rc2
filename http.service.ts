/*
 * Reusable service to handle HTTP requests GET/POST/with auth
 */

import {Injectable} from "@angular/core";
import {Response, Headers, Http, RequestOptions} from "@angular/http";
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
@Injectable()
export class HttpService {

    constructor(private _http: Http) { }

    /** class' properties */
    private _defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    /** class' methods */
    private _getRequestHeaders(requestUrl: string): Headers {
        let headers = this._defaultHeaders;
        let ROUTES_NO_AUTH = []; // add here routes for which the auth header is not necessary

        if (ROUTES_NO_AUTH.indexOf(requestUrl) === -1) {
            // add authorization header for paths who require login
            let user = localStorage.getItem("user");

            if (user) headers['authorization'] = "Bearer " + JSON.parse(user).token;
        }

        return new Headers(headers);
    }

    // #requestBody is a plain object
    // #requestOptions includes a field headers:Headers
    makePostRequest(requestUrl:string, requestBody: any, requestOptions?: RequestOptions): Promise<any> {
        requestOptions = requestOptions || new RequestOptions({ headers: this._getRequestHeaders(requestUrl) });

        console.log("route (POST) " + requestUrl, JSON.stringify(requestBody));

        return this._http.post(requestUrl, requestBody, requestOptions)
            .timeout(15000, new Error( 'HTTP (POST) timeout for path: ' + requestUrl))
            .map(this.extractData)
            .toPromise()
            .catch(this.handleError);
    }

    makeGetRequest(requestUrl:string, requestOptions?: RequestOptions): Promise<any> {
        requestOptions = requestOptions || new RequestOptions({ headers: this._getRequestHeaders(requestUrl) });

        console.log("route (GET - Promise) " + requestUrl);

        return this._http.get(requestUrl, requestOptions)
            .timeout(15000, new Error( 'HTTP (GET) timeout for path: ' + requestUrl))
            .map(this.extractData)
            .toPromise()
            .catch(this.handleError);
    }

    // convert data
    private extractData(res: Response) {
        if (res.status < 200 || res.status >= 300) {
            throw new Error('Bad response status: ' + res.status);
        }

        // parse response
        let body = res.json();
        console.log("response: ", body);
        // if an error field is present and not null, assume something went wrong
        if (body.error) {
            if (body.error.code === 401) {
                let user = JSON.parse(localStorage.getItem("user"));
                user.isValidSession = false;
                localStorage.setItem("user", JSON.stringify(user));
                return null;
            }

            // error will be caught in handleError()
            throw new Error(JSON.stringify(body.error));
        }

        return body;
    }

    private handleError(error: any) {
        let errMsg = error.message || 'Server error';
        console.log(error);
        console.log("error: ", errMsg);
        return Promise.reject(errMsg);
    }
}
