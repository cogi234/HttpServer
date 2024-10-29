import * as AssetsManager from '../assetManager.js';
import * as utilities from '../utilities.js';

export default class Model {
    constructor(securedId = false) {
        this.fields = [];
        if (securedId)
            this.addField('Id', 'string');
        else
            this.addField('Id', 'integer');
        this.key = null;
        this.securedId = securedId;
        this.state = {
            isValid: true,
            inConflict: false,
            notFound: false,
            errors: []
        };
    }

    addField(propertyName, propertyType) {
        if (!this.isMember(propertyName))
            this.fields.push({ name: propertyName, type: propertyType });
    }
    isMember(propertyName) {
        for (const field of this.fields) {
            if (field.name == propertyName)
                return true;
        }
        return false;
    }
    setKey(key) {
        this.key = key;
    }
    getClassName() {
        return this.constructor.name;
    }

    //Validation

    isValueValid(value, type) {
        if (value !== null) {
            switch (type) {
                case 'string': return true;
                case 'stringNotEmpty': return value != '';
                case 'integer': return utilities.tryParseInt(value) != NaN;
                case 'float': return utilities.tryParseFloat(value) != NaN;
                case 'boolean': return value === false || value === true;
                case "alpha": return /^[a-zA-Z\- 'ààâäæáãåāèéêëęėēîïīįíìôōøõóòöœùûüūúÿçćčńñÀÂÄÆÁÃÅĀÈÉÊËĘĖĒÎÏĪĮÍÌÔŌØÕÓÒÖŒÙÛÜŪÚŸÇĆČŃÑ]*$/.test(value);
                case "phone": return /^\(\d\d\d\) \d\d\d-\d\d\d\d$/.test(value);
                case "email": return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(value);
                case "url": return /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(value);
                case "zipcode": return /^[a-zA-Z][0-9]+[a-zA-Z]\s[0-9]+[a-zA-Z][0-9]+$/.test(value);
                case "date": return true; // TODO: syntax check
                case "array": return true; // TODO: validity check
                case "asset": return true; // TODO: verify if it's a blob
                default: return false;
            }
        }
        return false;
    }
    addError(message) {
        this.state.isValid = false;
        this.state.errors.push(message);
    }
    stringToType(instance, fieldName, type) {
        if (instance[fieldName]) {
            switch (type) {
                case 'integer': instance[fieldName] = parseInt(instance[fieldName]); break;
                case 'float': instance[fieldName] = parseFloat(instance[fieldName]); break;
            }
        }
    }
    validate(instance) {
        this.fields.forEach(field => {
            if (!(field.name in instance)) {
                this.addError(`The property [${field.name}] is missing...`);
                return;
            }
            if (!this.isValueValid(instance[field.name], field.type)) {
                this.addError(`The property [${field.name}] must be a valid ${field.type}...`);
                return;
            }
            if (this.state.isValid)
                this.stringToType(instance, field.name, field.type);
        });
    }

    //Assets

    handleAssets(instance, storedInstance = null) {
        this.fields.forEach(field => {
            if ((field.name in instance) && field.type == 'asset') {
                if (instance[field.name] == '') {
                    if (storedInstance) {
                        instance[field.name] = storedInstance[field.name];
                    }
                } else {
                    instance[field.name] = AssetsManager.save(instance[field.name]);
                    if (storedInstance) {
                        AssetsManager.remove(storedInstance[field.name]);
                    }
                }
            }
        });
    }

    removeAssets(instance) {
        this.fields.forEach(field => {
            if ((field.name in instance) && field.type == 'asset') {
                AssetsManager.remove(instance[field.name]);
            }
        });
    }

    addHostReferenceToAssetFileNames(instance) {
        this.fields.forEach(field => {
            if ((field.name in instance) && field.type == 'asset') {
                instance[field.name] = AssetsManager.addHostReference(instance[field.name]);
            }
        });
    }

    bindExtraData(instance) {
        let instanceCopy = { ...instance };
        this.addHostReferenceToAssetFileNames(instanceCopy);
        return instanceCopy;
    }
}