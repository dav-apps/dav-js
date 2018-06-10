interface IDictionary {
   add(key: string, value: string): void;
   remove(key: string): void;
   containsKey(key: string): boolean;
   keys(): string[];
   values(): string[];
}

class Dictionary implements IDictionary {

   _keys: string[] = [];
   _values: string[] = [];

   constructor(init: { key: string; value: string; }[]) {
		for (var x = 0; x < init.length; x++) {
			this[init[x].key] = init[x].value;
			this._keys.push(init[x].key);
			this._values.push(init[x].value);
		}
   }

   add(key: string, value: string) {
		this[key] = value;
		this._keys.push(key);
		this._values.push(value);
   }

   remove(key: string) {
		var index = this._keys.indexOf(key, 0);
		this._keys.splice(index, 1);
		this._values.splice(index, 1);

		delete this[key];
   }

   keys(): string[] {
		return this._keys;
   }

   values(): string[] {
      return this._values;
   }

   containsKey(key: string) {
      if (typeof this[key] === "undefined") {
         return false;
      }

      return true;
   }

   toLookup(): IDictionary {
      return this;
   }
}