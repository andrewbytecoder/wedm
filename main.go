package main

import (
	"embed"
	"log"

	"github.com/andrewbytecoder/wedm/backend"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := application.New(application.Options{
		Name:        "wedm",
		Description: "ETCD desktop manager",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	app.RegisterService(application.NewService(backend.NewApp(app)))

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "wedm",
		Width:            1200,
		Height:           800,
		MinWidth:         800,
		MinHeight:        600,
		BackgroundColour: application.NewRGBA(27, 38, 54, 255),
		URL:              "/",
		Windows: application.WindowsWindow{
			DisableIcon: false,
		},
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
