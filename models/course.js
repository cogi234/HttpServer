import Model from './model.js';

export default class Course extends Model {
    constructor() {
        super();

        this.addField('Code', 'string');
        this.addField('Title', 'string');

        this.setKey('Code');
    }
}