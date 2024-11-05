import * as utilities from '../utilities.js';

/**
 * This class is used to validate and filter the content of a repository
 */
export default class CollectionFilter {
    constructor(collection, filterParams, model = null) {
        this.model = model;
        this.collection = collection;
        this.sortFields = [];
        this.searchKeys = [];
        this.keywords = [];
        this.fields = [];
        this.ranges = [];
        this.filteredCollection = [];
        this.limit = undefined;
        this.offset = undefined;
        this.errorMessages = [];
        this.prepareFilter(filterParams);
    }

    error(message) {
        this.errorMessages.push(message);
    }

    isValid() {
        return this.errorMessages.length == 0;
    }

    normalizeName(name) {
        return utilities.capitalizeFirstLetter(name).trim();
    }

    validFieldName(context, fieldName) {
        if (this.model && !this.model.isMember(fieldName)) {
            this.error(`${context} : ${fieldName} is not a member of ${this.model.getClassName()} or is an invalid parameter`);
            return false;
        }
        return true;
    }

    prepareFilter(filterParams) {
        let instance = this;
        if (filterParams != null) {
            try {
                Object.keys(filterParams).forEach(function (paramName) {
                    let paramValue = filterParams[paramName];
                    if (paramValue) {
                        switch (paramName) {
                            case 'sort':
                                instance.setSortFields(paramValue);
                                break;
                            case 'limit':
                                instance.limit = utilities.tryParseInt(paramValue);
                                break;
                            case 'offset':
                                instance.offset = utilities.tryParseInt(paramValue);
                                break;
                            case 'fields':
                                instance.fields = paramValue.split(',');
                                break;
                            case 'keywords':
                                instance.keywords = paramValue.split(',');
                                break;
                            default:
                                let normalizedParamName = instance.normalizeName(paramName);
                                if (normalizedParamName.indexOf('.start') >= 0)
                                    instance.addRange(normalizedParamName, paramValue);
                                else if (normalizedParamName.indexOf('.end') >= 0)
                                    instance.addRange(normalizedParamName, paramValue);
                                else
                                    instance.addSearchKey(normalizedParamName, paramValue);
                        }
                    } else {
                        instance.error(`${paramName} parameter has an undefined value.`);
                    }
                });
            } catch (error) {
                this.error(`null parameter`);
            }
        }
        this.validateFieldsParam();
        this.validateLimitOffset();
    }

    validateFieldsParam() {
        for (let i = 0; i < this.fields.length; i++) {
            this.fields[i] = this.normalizeName(this.fields[i]);
            this.validFieldName("fields param", this.fields[i]);
        }
    }
    validateLimitOffset() {
        if (this.limit != undefined) {
            if (isNaN(this.limit))
                this.error(`limit value must be a positive integer`);
            else
                if (this.limit < 0)
                    this.error(`limit value must be a positive integer`);
            if (this.offset == undefined)
                this.error(`You must specify an offset with limit`);
        }
        if (this.offset != undefined) {
            if (isNaN(this.offset))
                this.error(`offset value must be a positive integer`);
            else
                if (this.offset < 0)
                    this.error(`offset value must be a positive integer`);
            if (this.limit == undefined)
                this.error(`You must specify a limit with offset`);
        }
    }

    makeSortField(fieldName) {
        fieldName = this.normalizeName(fieldName);
        let parts = fieldName.split(',');
        let sortField = "";
        let descending = false;

        if (parts.length > 0)
            sortField = parts[0];
        else {
            this.error("Must provide a valid name");
            return;
        }

        this.validFieldName("sort param", sortField);

        if (parts.length > 1) {
            if (parts[1].toLowerCase() !== 'desc')
                this.error("sort param", "Bad parameter: use 'desc' for descending, by default ascending.");
            else
                descending = true;
        }

        return {
            name: sortField,
            ascending: !descending
        };
    }
    setSortFields(fieldNames) {
        let sortField = null;
        if (Array.isArray(fieldNames)) {
            for (let fieldName of fieldNames) {
                sortField = this.makeSortField(fieldName);
                if (sortField)
                    this.sortFields.push(sortField);
            }
        } else {
            sortField = this.makeSortField(fieldNames);
            if (sortField)
                this.sortFields.push(sortField);
        }
    }

    addSearchKey(keyName, value) {
        if (this.validFieldName("search param", keyName))
            this.searchKeys.push({ name: keyName, value: value });
    }

    addRange(paramName, value) {
        let name = paramName.split('.')[0];
        if (this.validFieldName("range param", name)) {
            if (!isNaN(value) && !isNaN(parseFloat(value))) {
                value = parseFloat(value);
            }
            let startValue = paramName.split('.')[1] == "start";
            let found = false;
            this.ranges.forEach(range => {
                if (range.field == name) {
                    found = true;
                    if (startValue)
                        range.start = value;
                    else
                        range.end = value;
                }
            });
            if (!found) {
                let range = { field: name, start: value, end: value };
                this.ranges.push(range);
            }
        }
    }

    valueMatch(value, searchValue) {
        try {
            let sv = '^' + searchValue.toString().toLowerCase().replace(/\*/g, '.*') + '$';
            let v = value.toString().replace(/(\r\n|\n|\r)/gm, "").toLowerCase();
            return new RegExp(sv).test(v);
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    itemMatch(item) {
        if (item) {
            for (let key of this.searchKeys) {
                if (key.name in item) {
                    if (!Array.isArray(key.value)) {
                        if (!this.valueMatch(item[key.name], key.value))
                            return false;
                    } else {
                        let allMatch = true;
                        for (let value of key.value) {
                            if (!this.valueMatch(item[key.name], value))
                                allMatch = false;
                        }
                        return allMatch;
                    }
                } else
                    return false;
            }
            return true;
        }
        return false;
    }

    equal(objectX, objectY) {
        let equal = true;
        Object.keys(objectX).forEach(function (member) {
            if (objectX[member] != objectY[member]) {
                equal = false;
                return false;
            }
        })
        return equal;
    }
    exist(collection, object) {
        if (collection.length > 0) {
            for (let item of collection) {
                if (this.equal(item, object)) return true;
            }
            return false;
        }
        return false;
    }
    keepFields(collection) {
        if (this.fields.length > 0) {
            let subCollection = [];
            for (let item of collection) {
                let subItem = {};
                for (let field of this.fields) {
                    subItem[field] = item[field];
                }
                subCollection.push(subItem);
            }
            return subCollection;
        } else
            return collection;
    }
    findByKeys(collection) {
        let filteredCollection = [];
        if (this.searchKeys.length > 0) {
            for (let item of collection) {
                if (this.itemMatch(item))
                    filteredCollection.push(item);
            }
        } else
            filteredCollection = [...collection];
        return filteredCollection;
    }
    findByKeywords(collection) {
        if (this.keywords.length == 0 || this.model == null)
            return collection;

        let filteredCollection = [];

        for (const item of collection) {
            let record = '';
            for (const field of this.model.fields) {
                if (field.type == 'string')
                    record += item[field.name].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + " ";
            }

            let keep = true;
            for (const keyword of this.keywords) {
                if (record.indexOf(keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) == -1) {
                    keep = false;
                    break;
                }
            }
            if (keep)
                filteredCollection.push(item);
        }

        return filteredCollection;
    }
    compareNum(x, y) {
        if (x === y) return 0;
        else if (x < y) return -1;
        return 1;
    }
    innerCompare(x, y) {
        if ((typeof x) === 'string')
            return x.localeCompare(y);
        else
            return this.compareNum(x, y);
    }
    compare(itemX, itemY) {
        let fieldIndex = 0;
        let max = this.sortFields.length;
        do {
            let result = 0;
            if (this.sortFields[fieldIndex].ascending)
                result = this.innerCompare(itemX[this.sortFields[fieldIndex].name], itemY[this.sortFields[fieldIndex].name]);
            else
                result = this.innerCompare(itemY[this.sortFields[fieldIndex].name], itemX[this.sortFields[fieldIndex].name]);
            if (result == 0)
                fieldIndex++;
            else
                return result;
        } while (fieldIndex < max);
        return 0;
    }
    sort() {
        this.filteredCollection.sort((a, b) => this.compare(a, b));
    }
    flushDuplicates(collection) {
        let index = 0;
        let lastObj = null;
        let filteredCollection = [];
        while (index < collection.length) {
            if (index == 0) {
                filteredCollection.push(collection[index]);
                lastObj = collection[index];
                index++;
            }
            while (index < collection.length && this.equal(collection[index], lastObj)) index++;
            if (index < collection.length) {
                filteredCollection.push(collection[index]);
                lastObj = collection[index];
                index++;
            }
        }
        return filteredCollection;
    }
    filterByRanges(collection) {
        let filteredCollection = [];
        this.ranges.forEach(range => {
            this.setSortFields(range.field);
            collection.sort((a, b) => this.compare(a, b));
            collection.forEach(item => {
                let keep = false;
                keep = this.innerCompare(range.start, item[range.field]) <= 0;
                keep = keep && (this.innerCompare(item[range.field], range.end) <= 0);
                if (keep)
                    filteredCollection.push(item);
            })
        })
        return filteredCollection;
    }
    
    get() {
        if (this.isValid()) {
            this.filteredCollection = this.findByKeys(this.collection);
            this.filteredCollection = this.findByKeywords(this.filteredCollection);
            if (this.fields.length > 0) {
                this.filteredCollection = this.keepFields(this.filteredCollection);
                this.prevSortFields = [...this.sortFields];
                this.sortFields = [];
                this.fields.forEach(fields => { this.setSortFields(fields); });
                this.filteredCollection.sort((a, b) => this.compare(a, b));
                this.filteredCollection = this.flushDuplicates(this.filteredCollection);
                this.sortFields = this.prevSortFields;
            }
            if (this.ranges.length > 0) {
                this.prevSortFields = [...this.sortFields];
                this.filteredCollection = this.filterByRanges(this.filteredCollection);
                this.sortFields = this.prevSortFields;
            }
            if (this.sortFields.length > 0)
                this.sort();
            if (this.limit != undefined) {
                return this.filteredCollection.slice(this.offset, this.offset + this.limit);
            }
            return this.filteredCollection;
        } else
            return null
    }
}