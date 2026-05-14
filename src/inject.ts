/**
 * Bridge script to access WhatsApp Web's internal modules.
 */
(function() {
    console.log('Stacker: Inject script running');

    const STACKER_MODULES: Record<string, any> = {
        Store: {
            search: (m: any) => m.default && m.default.Chat && m.default.Msg ? m.default : null
        },
        Msg: {
            search: (m: any) => m.default && m.default.prototype && m.default.prototype.isSentByMe ? m.default : null
        },
        Sticker: {
            search: (m: any) => m.default && m.default.prototype && m.default.prototype.isSticker ? m.default : null
        },
        StickerPack: {
            search: (m: any) => m.default && m.default.prototype && m.default.prototype.isStickerPack ? m.default : null
        },
        Cmd: {
            search: (m: any) => m.Cmd ? m : null
        }
    };

    const discoveredModules: Record<string, any> = {};

    function discover() {
        if (!(window as any).webpackChunkwhatsapp_web_client) return;

        console.log('Stacker: Attempting module discovery via webpack hook...');

        (window as any).webpackChunkwhatsapp_web_client.push([
            [Math.random()],
            {},
            function(e: any) {
                // Iterate over all module IDs
                for (const t in e.m) {
                    try {
                        const m = e(t);
                        if (!m) continue;
                        
                        for (const key in STACKER_MODULES) {
                            if (discoveredModules[key]) continue;
                            const found = STACKER_MODULES[key].search(m);
                            if (found) {
                                console.log(`Stacker: Discovered ${key}`);
                                discoveredModules[key] = found;
                            }
                        }
                    } catch (err) {
                        // Some modules might throw when required early
                    }
                }
            }
        ]);

        (window as any).Stacker = {
            modules: discoveredModules,
            get isReady() {
                return !!discoveredModules.Store;
            }
        };

        if ((window as any).Stacker.isReady) {
            console.log('Stacker: Core modules discovered and ready.');
        } else {
            console.log('Stacker: Discovery incomplete, will retry.');
        }
    }

    const checkInterval = setInterval(() => {
        if ((window as any).webpackChunkwhatsapp_web_client) {
            clearInterval(checkInterval);
            discover();
        }
    }, 1000);

    // Communicate with content script
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data.type || event.data.source !== 'stacker-content') return;

        const Stacker = (window as any).Stacker;

        if (event.data.type === 'GET_MODULES_STATUS') {
            window.postMessage({
                type: 'MODULES_STATUS',
                source: 'stacker-inject',
                isReady: Stacker.isReady,
                discovered: Object.keys(discoveredModules)
            }, '*');
        }

        if (event.data.type === 'SEND_STICKER' && Stacker.isReady) {
            const { stickerId } = event.data;
            const chat = discoveredModules.Store.Chat.getActive();
            if (chat && stickerId) {
                const sticker = discoveredModules.Store.Sticker.get(stickerId);
                if (sticker) {
                    console.log('Stacker: Sending sticker:', stickerId);
                    if (sticker.sendToChat) {
                        sticker.sendToChat(chat);
                    } else if (discoveredModules.Cmd && discoveredModules.Cmd.sendSticker) {
                        discoveredModules.Cmd.sendSticker(sticker, chat);
                    } else if (chat.sendSticker) {
                        chat.sendSticker(sticker);
                    } else {
                        console.error('Stacker: No send method found for sticker');
                    }
                } else {
                    console.error('Stacker: Sticker not found in Store:', stickerId);
                }
            }
        }

        if (event.data.type === 'TAG_STICKERS_IN_DOM' && Stacker.isReady) {
            const stickerElements = document.querySelectorAll('div[role="button"] img[src^="blob:"]');
            const stickerArray = discoveredModules.Store.Sticker.toArray ? 
                                 discoveredModules.Store.Sticker.toArray() : 
                                 (discoveredModules.Store.Sticker.models || []);

            stickerElements.forEach((img: any) => {
                if (img.getAttribute('data-stacker-id')) return;
                
                // Try matching by URL/blob
                let sticker = stickerArray.find((s: any) => s.url === img.src || s.directPath === img.src);
                
                // If not found, try matching by looking at the parent's React props (more reliable but complex)
                if (!sticker) {
                    try {
                        const button = img.closest('div[role="button"]');
                        const propsKey = Object.keys(button).find(k => k.startsWith('__reactProps'));
                        if (propsKey) {
                            const props = (button as any)[propsKey];
                            const stickerData = props?.children?.props?.sticker || props?.children?.[0]?.props?.sticker;
                            if (stickerData) {
                                sticker = discoveredModules.Store.Sticker.get(stickerData.id._serialized || stickerData.id);
                            }
                        }
                    } catch (e) {}
                }

                if (sticker) {
                    const id = sticker.id._serialized || sticker.id;
                    img.setAttribute('data-stacker-id', id);
                    const button = img.closest('div[role="button"]');
                    if (button) {
                        button.setAttribute('data-stacker-id', id);
                        // Add a class so content script can find it easily
                        button.classList.add('stacker-tagged-sticker');
                    }
                    
                    window.postMessage({
                        type: 'STICKER_DATA_DISCOVERED',
                        source: 'stacker-inject',
                        stickerId: id,
                        url: sticker.url || sticker.directPath
                    }, '*');
                }
            });
        }

        if (event.data.type === 'GET_STICKERS_URLS' && Stacker.isReady) {
            const { stickerIds } = event.data;
            const results: Record<string, string> = {};
            stickerIds.forEach((id: string) => {
                const sticker = discoveredModules.Store.Sticker.get(id);
                if (sticker) {
                    results[id] = sticker.url || sticker.directPath;
                }
            });
            window.postMessage({
                type: 'STICKERS_URLS_RESPONSE',
                source: 'stacker-inject',
                requestId: event.data.requestId,
                urls: results
            }, '*');
        }
    });

})();
