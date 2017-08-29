/*
 * Reusable utility service with several methods to work with objects, arrays, timezones, ...
 */

import {Injectable} from '@angular/core';
import {Control} from "@angular/common";

@Injectable()
export class UtilityService {
    /** auxiliary functions */
    // @credit http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    cloneObject(object: any): any {
        let copy,
            classRef = this;
    
        // Handle the 3 simple types, and null or undefined
        if (null == object || "object" != typeof object) return object;
    
        // Handle Date
        if (object instanceof Date) {
            copy = new Date();
            copy.setTime(object.getTime());
            return copy;
        }
    
        // Handle Array
        if (object instanceof Array) {
            copy = [];
            for (var i = 0, len = object.length; i < len; i++) {
                copy[i] = classRef.cloneObject(object[i]);
            }
            return copy;
        }
    
        // Handle Object
        if (object instanceof Object) {
            copy = {};
            for (var attr in object) {
                if (object.hasOwnProperty(attr)) copy[attr] = classRef.cloneObject(object[attr]);
            }
            return copy;
        }
    
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    mergeObjects(first: any, second: any): any {
        let tmp = {};
        for (var attrname in first) { tmp[attrname] = first[attrname]; }
        for (var attrname in second) { tmp[attrname] = second[attrname]; }
        return tmp;
    }

    shuffleArray(array: any[]) {
        var j, x, i;
        for (i = array.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = array[i - 1];
            array[i - 1] = array[j];
            array[j] = x;
        }
    }

    private isObjectPropertyInArray = function(objectArray: any[], sourceObject: any, propertyName: string){
        for (let i in objectArray) {
            if (objectArray[i][propertyName] == sourceObject[propertyName]) return true;
        }
        return false;
    };

    isElementInArray(element: string | number, array: Array<string | number>) {
        return array.indexOf(element) !== -1;
    }
    
    /** class methods */
    // @returns unique ID
    // @credit http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    getGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    // @returns by propertyName objects belonging to sourceObjectArray's objects but not to objectArray's objects
    getObjectArraysDiffIntersection(sourceObjectArray: any[], objectArray: any[], propertyName: string){
        let objectArrayClone = [],
            objectArrayIntersection = [],
            classRef = this;

        // clone object arrays
        objectArray.forEach(objectArray => {
            objectArrayClone.push(classRef.cloneObject(objectArray));
        });

        // filter objects
        sourceObjectArray.forEach(sourceObject => {
            if(!classRef.isObjectPropertyInArray(objectArrayClone, sourceObject, propertyName))
                objectArrayIntersection.push(sourceObject);
        });

        return objectArrayIntersection;
    }

    getArrayIntersection(array1: number[], array2: number[]) {
        return array1.filter(function(n) {
            return array2.indexOf(n) > -1;
        });
    }

    // @returns by propertyName objects belonging to sourceObjectArray's objects but not to 2-D objectArray's objects
    getObjectTwoDimensionalArraysDiffIntersection(sourceObjectArray: any[], twoDimensionalObjectArray: any[][], propertyName: string){
        let objectArrayMerge = [],
            objectArrayIntersection = [],
            classRef = this;

        // clone object arrays and merge them
        twoDimensionalObjectArray.forEach(objectArray => {
            for (let object in objectArray){
                objectArrayMerge.push(classRef.cloneObject(objectArray[object]));
            }
        });

        // filter objects
        sourceObjectArray.forEach(sourceObject => {
            if(!classRef.isObjectPropertyInArray(objectArrayMerge, sourceObject, propertyName))
                objectArrayIntersection.push(sourceObject);
        });

        return objectArrayIntersection;
    }

    // @Returns a timestamp in local timezone (e.g. CEST = UTC+2)
    getSecondsFromTimeParts(hours: number, minutes: number): number {
        return hours * 3600 + minutes * 60;
    }

    // @Returns a timestamp in LOCAL timezone
    getTimePartFromTimestamp(timestamp: number, type: string): number {
        if (type == "m") return Math.trunc(Math.floor(timestamp % 3600) / 60);
        else if (type == "h") return Math.floor(timestamp / 3600);
    }

    // @Returns a timestamp in UTC timezone
    getTimePartFromUTCTimestamp(timestamp: number, type: string, timezone: string): number {
        // add/remove timezone in seconds
        timestamp += this.getSecondsFromTimezoneString(timezone);

        // calculate minute/hour
        if (type == "m") return Math.trunc(Math.floor(timestamp % 3600) / 60);
        else if (type == "h") return Math.floor(timestamp / 3600);
    }

    // @params Timezone string "+|-hh:mm
    // @returns Timezone integer +-h.m
    getTimezoneFromString(timezoneString: string): number {
        try {
            let operator: string = timezoneString[0],
                stringSplit = timezoneString.substr(1).split(":"),
                minutes: number;

            // determine decimal value
            if (stringSplit[1] === "00") minutes = 0;
            else if (stringSplit[1] === "30") minutes = 0.5;
            else minutes = 0.75;

            return ((parseInt(stringSplit[0]) + minutes) * (operator === "+" ? 1 : -1));
        }
        catch (e) { return 0; }
    }

    getStringFromTimezone(timezone: any): string {
        try {
            let decimalPart: number = timezone - Math.trunc(timezone),
                minutes: string,
                operator: string;

            if (timezone >= 0) operator = "+";
            else operator = "-";

            decimalPart = Math.abs(decimalPart);
            if (decimalPart == 0) minutes = "00";
            else if (decimalPart == 0.5) minutes = "30";
            else minutes = "45";

            return ((timezone >= 0 ? "+" : "-") +
                    (Math.abs(timezone) < 10 ? "0" + Math.abs(Math.trunc(timezone)) : Math.abs(Math.trunc(timezone)))
                + ":" + minutes
            );
        }
        catch (e) { return "+00:00"; }
    }

    getSecondsFromTimezoneString(timezone: string): number {
        return this.getTimezoneFromString(timezone) * 3600;
    }

    roundUpTo(number, upto){
        // toFixed converts a number to string while keeping 2 decimals
        return Number(number.toFixed(upto));
    }

    isNanOrEmtpy(value: number) {
        return Number.isNaN(value) || !value;
    }

    // group array elements based on provided key/property
    // @credit: http://stackoverflow.com/a/34890276/1219368
    // usage example: groupBy(['one', 'two', 'three'], 'length')
    groupBy(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };
}
