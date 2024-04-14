class FileExplorer {

    current_project_file_handle = null;

    readFileContents = async (file) => {
        try {
            const fileContents = await file.text();
            return JSON.parse(fileContents); // Parse JSON text into an object
        } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            return null; // Return null if there's an error reading the file
        }
    }

    SaveFileEntry = async () => {
        console.log(this.current_project_file_handle, 'CTRL + S');

        const writable = await this.current_project_file_handle.createWritable();
        const date = new Date()
        const date_time_string = date.toLocaleDateString() + " " + date.toLocaleTimeString()

        const data_to_save = {
            "paths": this.view.getCurrentPlotState,
            "timestamp": date_time_string,
            "thumbnail": []
        }

        const contents = JSON.stringify(data_to_save, function (key, val) {
            return val.toFixed ? Number(val.toFixed(3)) : val;
        })

        await writable.write(contents);
        await writable.close();
    }

    LoadFileEntry = async (entry) => {
        console.log(entry)
        document.title = entry.name
        this.current_project_file_handle = entry
        const file = await entry.getFile();
        const contents = await this.readFileContents(file);
        this.loadedCallback(contents)
    }

    setupDragExplorer = function () {
        const explorer_node = document.getElementById("explorer");
        const gui_node = document.getElementById("gui");

        const BORDER_SIZE = 20;
        let m_pos;
        function resize(e) {
            explorer_node.style.width = e.x + "px";
            gui_node.style.left = e.x + "px";
        }

        explorer_node.addEventListener("mousedown", function (e) {
            currentWidth = parseInt(getComputedStyle(explorer_node, '').width)
            if (Math.abs(e.offsetX - currentWidth) < BORDER_SIZE) {
                document.addEventListener("mousemove", resize, false);
            }
        }, false);

        document.addEventListener("mouseup", function () {
            document.removeEventListener("mousemove", resize, false);
        }, false);
    }

    loadDirectory = async (element, mouseEvent) => {
        const explorer_node = document.getElementById("explorer");
        const directoryHandle = await window.showDirectoryPicker();
        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file') {
                console.log(entry)
                var project_name = entry.name.split(".")[0]
                if (!entry.name.endsWith("json")) continue;
                var projectEntry = document.createElement("div")
                var projectEntryTitle = document.createElement("h1")
                var projectEntryInfo = document.createElement("span")
                projectEntry.appendChild(projectEntryTitle)
                projectEntry.appendChild(projectEntryInfo)

                projectEntry.classList.add('explorerEntry')
                projectEntryTitle.innerText = project_name

                const file = await entry.getFile();
                const contents = await this.readFileContents(file);
                console.log(contents)
                console.log(contents)
                const time = contents.timestamp || contents.modified_time || "Notime"
                console.log(time)
                projectEntryInfo.innerHTML += contents.timestamp + "<br>"
                var totalVert = 0
                var totalLine = 0
                if (contents.paths) {
                    contents.paths.forEach(p => {
                        var total = p.reduce((acc, current) => current.length + acc, 0)
                        totalVert += total
                        totalLine += p.length
                    })
                }

                projectEntryInfo.innerHTML += totalVert + " vert " + totalLine + " lines"

                explorer_node.appendChild(projectEntry)

                projectEntry.addEventListener("click", function (e) {
                    this.LoadFileEntry(entry)
                }.bind(this))
            }
        }

        document.removeEventListener("click", this.printFilesInDirectory);// Add onclick eventListener 
    };

    saveProject = async function (app_model, name) {
        const date = new Date()
        const date_time_string = date.toLocaleDateString() + " " + date.toLocaleTimeString()
        if (!app_model.created_time) {
            app_model.created_time = date_time_string
        }

        app_model.modified_time = date_time_string

        var fileContent = JSON.stringify(app_model, function (key, val) {
            return val && val.toFixed ? Number(val.toFixed(3)) : val;
        })

        var contents = new Blob([fileContent], { type: 'text/plain' });

        const writable = await this.current_project_file_handle.createWritable();
        await writable.write(contents);
        await writable.close();
    }

    constructor(loadedCallback, saveCallback) {
        this.app_model = app_model
        this.loadedCallback = loadedCallback;
        this.saveCallback = saveCallback;
        const explorer_node = document.getElementById("explorer");
        
        
        var load_button = document.createElement("button")
        load_button.innerText = "Open Folder"
        explorer_node.appendChild(load_button)

        load_button.addEventListener("click", function (e) {
            this.loadDirectory()

        }.bind(this))

        var save_button = document.createElement("button")
        save_button.innerText = "save"
        explorer_node.appendChild(save_button)

        save_button.addEventListener("click", function (e) {
            this.saveCallback()
        }.bind(this))


    }
}
