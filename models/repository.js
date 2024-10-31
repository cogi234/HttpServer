import fs from "fs";
import { v1 as uuid } from 'uuid';

import * as utilities from '../utilities.js';
import RepositoryCacheManager from './repositoryCacheManager.js';
import CollectionFilter from "./collectionFilter.js";

global.jsonFilesPath = 'jsonFiles';
global.repositoryETags = {};

export default class Repository {
    constructor(modelClass, cached = true) {
        this.objectsList = null;
        this.model = modelClass;
        this.objectsName = modelClass.getClassName() + "s";
        this.objectsFile = `./${jsonFilesPath}/${this.objectsName}.json`;
        this.cached = cached;
        this.initETag();
        this.errorMessages = [];
    }

    /**
     * @returns true if there are no errors
     */
    isValid() {
        return this.errorMessages.length == 0;
    }

    /**
     * Initializes ETag
     */
    initETag() {
        if (this.objectsName in repositoryETags)
            this.ETag = repositoryETags[this.objectsName];
        else
            this.newETag();
    }

    /**
     * Creates a new ETag
     */
    newETag() {
        this.ETag = uuid();
        repositoryETags[this.objectsName] = this.ETag;
    }

    /**
     * Gets the current ETag for the model
     */
    static getETag(modelName) {
        if (modelName in repositoryETags)
            return repositoryETags[modelName];
        return null;
    }

    /**
     * @returns the list of objects
     */
    objects() {
        if (this.objectsList == null)
            this.read();
        return this.objectsList;
    }

    /**
     * Reads the file to populate the object list
     */
    read() {
        this.objectsList = null;
        if (this.cached) {
            this.objectsList = RepositoryCacheManager.find(this.objectsName);
        }
        if (this.objectsList == null) {
            try {
                let rawdata = fs.readFileSync(this.objectsFile);
                this.objectsList = JSON.parse(rawdata);
                //We cache the data
                if (this.cached)
                    RepositoryCacheManager.add(this.objectsName, this.objectsList);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.objectsList = [];
                    console.log(FgYellow, `Warning ${this.objectsName} repository does not exist. It will be created on demand`);
                } else {
                    console.log(FgRed, `Error while reading ${this.objectsName} repository`);
                    console.log(FgRed, '--------------------------------------------------');
                    console.log(FgRed, error);
                }
            }
        }
    }

    /**
     * Writes the object list to the file
     */
    write() {
        this.newETag();
        fs.writeFileSync(this.objectsFile, JSON.stringify(this.objectsList));
        if (this.cached)
            RepositoryCacheManager.add(this.objectsName, this.objectsList);
    }

    /**
     * @returns the next id to insert
     */
    nextId() {
        let maxId = 0;
        for (let object of this.objects()) {
            if (object.Id > maxId) {
                maxId = object.Id;
            }
        }
        return maxId + 1;
    }

    /**
     * Checks if the model instance is in conflict with something in our repository
     * @returns true: in conflict, false: not in conflict
     */
    checkConflict(instance) {
        if (this.model.key && this.findByField(this.model.key, instance[this.model.key], instance.Id)) {
            this.model.addError(`Unicity conflict on [${this.model.key}]...`);
            this.model.state.inConflict = true;
            return true
        }
        return false;
    }

    /**
     * Inserts the object, with the next id, while checking for conflicts and validity
     * @returns The resulting object
     */
    add(object) {
        delete object.Id;
        object = { Id: 0, ...object };
        this.model.validate(object);

        if (this.model.state.isValid) {
            this.checkConflict(object);
            if (!this.model.state.inConflict) {
                object.Id = this.nextId();
                this.model.handleAssets(object);
                this.objectsList.push(object);
                this.write()
            }
        }
        return object;
    }
    /**
     * Updates the object with the specified id, while checking for existence, conflicts and validity
     * @returns The resulting object
     */
    update(id, objectToModify) {
        delete objectToModify.Id;
        objectToModify = { Id: id, ...objectToModify };
        this.model.validate(objectToModify);

        if (this.model.state.isValid) {
            let index = this.indexOf(objectToModify.Id);
            if (index >= 0) {
                this.checkConflict(objectToModify);
                if (!this.model.state.inConflict) {
                    this.model.handleAssets(objectToModify, this.objectsList[index]);
                    this.objectsList[index] = objectToModify;
                    this.write();
                }
            } else {
                this.model.addError(`The ressource [${objectToModify.Id}] does not exist.`);
                this.model.state.notFound = true;
            }
        }
        return objectToModify;
    }

    /**
     * Tries to remove the object with the specified id
     * @returns Success status (true or false)
     */
    remove(id) {
        let index = 0;
        for (let object of this.objects()) {
            if (object.Id == id) {
                this.model.removeAssets(object);
                this.objectsList.splice(index, 1);
                this.write();
                return true;
            }
            index++;
        }
        return false;
    }

    /**
     * Get all objects, with bound with extra data, if necessary
     * @param {null} [params=null] Search/filter parameters
     * @param {boolean} [bind=true] Do we bind extra data?
     */
    getAll(params = null, bind = true) {
        let objectsList = this.objects();
        let boundData = [];
        if (objectsList) {
            for (let data of objectsList) {
                if (bind)
                    boundData.push(this.model.bindExtraData(data));
                else
                    boundData.push(data);
            }
        }

        let collectionFilter = new CollectionFilter(boundData, params, this.model);
        if (collectionFilter.isValid())
            return collectionFilter.get();

        this.errorMessages = collectionFilter.errorMessages;
        return null;
    }

    /**
     * Get the object with the specified id, with bound with extra data, if necessary
     * @param {boolean} [bind=true] Do we bind extra data?
     */
    get(id, bind = true) {
        for (let object of this.objects()) {
            if (object.Id == id)
                if (bind)
                    return this.model.bindExtraData(object);
                else
                    return object;
        }
        return null;
    }

    /**
     * Removes the object at the specified indexes
     * @param {int[]} indexes The indexes of the elements we want to delete, in ascending order
     */
    removeByIndex(indexes) {
        if (indexes.length > 0) {
            utilities.deleteByIndex(this.objects(), indexes);
            this.write();
        }
    }

    /**
     * Filters the content of the repository by the passed function.
     * true = keep, false = delete
     */
    keepByFilter(filterFunction) {
        let objectsList = this.objects();
        if (objectsList) {
            thif.objectsList = objectsList.filter(filterFunction);
            this.write();
        }
    }

    /**
     * @returns the objects that match the filter function
     */
    findByFilter(filterFunction) {
        let objectsList = this.objects();
        if (objectsList) {
            return objectsList.filter(filterFunction);
        }
        return null;
    }

    /**
     * Find the object where fieldName == value, excluding the object with Id == excludedId
     */
    findByField(fieldName, value, exludedId = 0) {
        if (fieldName) {
            let index = 0;
            for (let object of this.objects()) {
                try {
                    if (object[fieldName] === value)
                        if (object.Id != exludedId)
                            return this.objectsList[index];
                    index++;
                } catch (error) { break; }
            }
        }
        return null;
    }

    /**
     * @returns the index of the object with the id. -1 if not found
     */
    indexOf(id) {
        let index = 0;
        for (let object of this.objects()) {
            if (object.Id == id) return index;
            index++;
        }
        return -1;
    }
}