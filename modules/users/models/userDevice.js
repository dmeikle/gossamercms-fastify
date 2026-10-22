
import {BaseModel} from "#mvc/models/BaseModel.js";
import {ModelMeta} from "#mvc/models/ModelMeta.js";
import {Instant} from "#mvc/util/uuid.js";

export class UserDevice extends BaseModel {
        static META = ModelMeta.builderWithId('user_devices')
            .datasource('mysql')
            .column('id', String)
            .column('userId', String)
            .column('firebaseToken', String, 500)
            .column('platform', String, 20)
            .column('deviceId', String, 255)
            .column('appVersion', String, 50)
            .column('active', Boolean)
            .column('lastSeenAt', Instant)
            .column('createdAt', Instant)
            .column('updatedAt', Instant)
            .defaultSort('createdAt desc')
            .build();

        constructor({
            id = null,
            userId = null,
            firebaseToken = null,
            platform = null,
            deviceId = null,
            appVersion = null,
            active = null,
            lastSeenAt = null,
            createdAt = null,
            updatedAt = null,
        } = {}) {
            super();
            this.id = id;
            this.userId = userId;
            this.firebaseToken = firebaseToken;
            this.platform = platform;
            this.deviceId = deviceId;
            this.appVersion = appVersion;
            this.active = active;
            this.lastSeenAt = lastSeenAt;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
}

export default UserDevice;