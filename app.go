package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed app_embed/*
var embedded embed.FS

// App exposes desktop integration to the Vue frontend (replaces Electron ipcMain).
type App struct {
	ctx context.Context

	watchMu        sync.Mutex
	kvWatchCancel  context.CancelFunc
	revWatchCancel context.CancelFunc

	userWatchMu      sync.Mutex
	userWatchCancels map[string]context.CancelFunc // guarded by userWatchMu
}

func NewApp() *App {
	return &App{
		userWatchCancels: make(map[string]context.CancelFunc),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(context.Context) {
	a.EtcdStopAllUserWatches()
	a.stopKVWatchLocked()
	a.stopKeyRevWatchLocked()
}

func (a *App) stopKVWatchLocked() {
	if a.kvWatchCancel != nil {
		a.kvWatchCancel()
		a.kvWatchCancel = nil
	}
}

func (a *App) stopKeyRevWatchLocked() {
	if a.revWatchCancel != nil {
		a.revWatchCancel()
		a.revWatchCancel = nil
	}
}

// GetAppVersion returns a display version (override via ldflags in CI if needed).
func (a *App) GetAppVersion() string {
	meta, err := a.readAppMeta()
	if err != nil {
		return "dev"
	}
	return meta.Version
}

// GetPackageMetadata returns embedded package metadata as JSON (replaces reading package.json from disk in Electron).
func (a *App) GetPackageMetadata() (string, error) {
	b, err := embedded.ReadFile("app_embed/app-meta.json")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// GetWhatsNewMarkdown returns release notes for the in-app dialog.
func (a *App) GetWhatsNewMarkdown() (string, error) {
	b, err := embedded.ReadFile("app_embed/WHATSNEW.md")
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// ReadTextFile reads a UTF-8 text file from an absolute path the user selected.
func (a *App) ReadTextFile(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// WriteTextFile writes UTF-8 text to path.
func (a *App) WriteTextFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0o644)
}

// OpenImportConfigPath opens a file picker for JSON settings import.
func (a *App) OpenImportConfigPath() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import settings",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON", Pattern: "*.json;*.JSON"},
		},
	})
}

// OpenExportConfigPath opens a save dialog for JSON settings export.
func (a *App) OpenExportConfigPath(defaultName string) (string, error) {
	name := defaultName
	if name == "" {
		name = "etcd-manager-settings.json"
	}
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export settings",
		DefaultFilename: name,
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON", Pattern: "*.json"},
		},
	})
}

// OpenSSLFilePath opens a file picker for TLS material (cert/key/chain).
func (a *App) OpenSSLFilePath() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select certificate file",
		Filters: []runtime.FileFilter{
			{DisplayName: "Certificates and keys", Pattern: "*.pem;*.crt;*.key;*.cer;*.*"},
		},
	})
}

// OpenExternalURL opens a URL in the system browser.
func (a *App) OpenExternalURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

type appMeta struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Title   string `json:"title"`
}

func (a *App) readAppMeta() (*appMeta, error) {
	b, err := embedded.ReadFile("app_embed/app-meta.json")
	if err != nil {
		return nil, err
	}
	var m appMeta
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, fmt.Errorf("app meta: %w", err)
	}
	return &m, nil
}
