export default class AccessControl {
    //Permissions
    // 0 anonymous, 1 user, 2 admin
    static anonymous() {
        return { readAccess: 0, writeAccess: 0 };
    }
    static anonymousReadOnly() {
        return { readAccess: 0, writeAccess: 2 };
    }
    static userReadOnly() {
        return { readAccess: 1, writeAccess: 2 };
    }
    static user() {
        return { readAccess: 1, writeAccess: 1 };
    }
    static superUser() {
        return { readAccess: 2, writeAccess: 1 };
    }
    static admin() {
        return { readAccess: 2, writeAccess: 2 };
    }

    /**
     * Are both read and write permissions granted?
     * @returns true or false
     */
    static granted(authorizations, requiredAccess) {
        if (requiredAccess) {
            if (requiredAccess.readAccess == 0 && requiredAccess.writeAccess == 0) return true;
            if (authorizations)
                return ( authorizations.readAccess >= requiredAccess.readAccess &&
                         authorizations.writeAccess >= requiredAccess.writeAccess );
            else
                return false;
        }
        return true; // no authorization needed
    }
    /**
     * Are read permissions granted?
     * @returns true or false
     */
    static readGranted(authorizations, requiredAccess) {
        if (requiredAccess) {
            if (requiredAccess.readAccess == 0) return true;
            if (authorizations)
                return ( authorizations.readAccess >= requiredAccess.readAccess );
            else
                return false;
        }
        return true;
    }
    /**
     * Are write permissions granted?
     * @returns true or false
     */
    static writeGranted(authorizations, requiredAccess) {
        if (requiredAccess) {
            if (requiredAccess.writeAccess == 0) return true;
            if (authorizations)
                return ( authorizations.writeAccess >= requiredAccess.writeAccess );
            else
                return false;
        }
        return true;
    }
    /**
     * Are write permissions granted?
     * @param {*} id The id of the admin we compare to, I think
     * @returns  true or false
     */
    static writeGrantedAdminOrOwner(HttpContext, requiredAccess, id) {
        if (requiredAccess) {
            if (requiredAccess.writeAccess == 0) return true;
            if (HttpContext.user && HttpContext.authorizations)
                return (
                    authorizations.writeAccess >= requiredAccess.writeAccess ||
                    HttpContext.user.Id == id
                );
            else
                return false;
        }
        return true;
    }
}