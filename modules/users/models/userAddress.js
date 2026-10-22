
import {BaseModel} from "#mvc/models/BaseModel.js";
import {ModelMeta} from "#mvc/models/ModelMeta.js";
import {Instant} from "#mvc/util/uuid.js";

export class UserAddress extends BaseModel {
        static META = ModelMeta.builderWithId('user_addresses')
            .datasource('mysql')
            .column('id', String)
            .column('userId', String)
            .column('type', String, 50)
            .column('address1', String, 255)
            .column('address2', String, 255)
            .column('city', String, 100)
            .column('stateProvince', String, 100)
            .column('postalCode', String, 20)
            .column('countryCode', String, 10)
            .column('isDefault', Boolean)
            .column('isBilling', Boolean)
            .defaultSort('createdAt desc')
            .build();

        constructor({
            id = null,
            userId = null,
            type = null,
            address1 = null,
            address2 = null,
            city = null,
            stateProvince = null,
            postalCode = null,
            countryCode = null,
            isDefault = null,
            isBilling = null,
        } = {}) {
            super();
            this.id = id;
            this.userId = userId;
            this.type = type;
            this.address1 = address1;
            this.address2 = address2;
            this.city = city;
            this.stateProvince = stateProvince;
            this.postalCode = postalCode;
            this.countryCode = countryCode;
            this.isDefault = isDefault;
            this.isBilling = isBilling;
        }
}

export default UserAddress;