class BasePlugin {
    picker;
    options;
    priority = 0;
    dependencies = [];
    /**
     * - Called automatically via PluginManager.initialize() or PluginManager.addInstance() -
     * Add plugin to the picker
     *
     * @param picker
     */
    attach(picker) {
        const pluginName = this['getName']();
        const optionsOriginal = { ...this.options };
        this.options = {
            ...this.options,
            ...(picker.options[pluginName] || {}),
        };
        // copy deep object options
        for (const objName of Object.keys(optionsOriginal)) {
            if (optionsOriginal[objName] !== null
                && typeof optionsOriginal[objName] === 'object'
                && Object.keys(optionsOriginal[objName]).length
                && pluginName in picker.options
                && objName in picker.options[pluginName]) {
                const optionValue = { ...picker.options[pluginName][objName] };
                if (optionValue !== null
                    && typeof optionValue === 'object'
                    && Object.keys(optionValue).length
                    && Object.keys(optionValue).every(opt => Object.keys(optionsOriginal[objName]).includes(opt))) {
                    this.options[objName] = { ...optionsOriginal[objName], ...optionValue };
                }
            }
        }
        this.picker = picker;
        if (this.dependenciesNotFound()) {
            const deps = this.dependencies.filter(x => !this.pluginsAsStringArray().includes(x));
            console.warn(`${this['getName']()}: required dependencies (${deps.join(', ')}).`);
            return;
        }
        const pluginClass = this.camelCaseToKebab(this['getName']());
        this.picker.ui.container.classList.add(pluginClass);
        this['onAttach']();
    }
    /**
     * - Called automatically via PluginManager.removeInstance() -
     * Remove plugin from the picker
     */
    detach() {
        const pluginClass = this.camelCaseToKebab(this['getName']());
        this.picker.ui.container.classList.remove(pluginClass);
        if (typeof this['onDetach'] === 'function') {
            this['onDetach']();
        }
    }
    /**
     * Check dependencies for plugin
     *
     * @returns Boolean
     */
    dependenciesNotFound() {
        return this.dependencies.length
            && !this.dependencies.every(v => this.pluginsAsStringArray().includes(v));
    }
    /**
     * Return plugins list as string array
     *
     * @returns []
     */
    pluginsAsStringArray() {
        return this.picker.options.plugins
            .map(x => typeof x === 'function' ? (new x).getName() : x);
    }
    /**
     * Return camelCase in kebab-case
     * Eg.: `userName` -> `user-name`
     *
     * @param str
     * @returns String
     */
    camelCaseToKebab(str) {
        return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
    }
}

export { BasePlugin };
