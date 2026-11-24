import AuthenticationServices
import Capacitor
import CryptoKit
import Security
import UIKit

final class StoreBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StoreSessionPlugin())
        bridge?.registerPluginInstance(StoreExternalSignInPlugin())
    }
}

@objc(StoreSessionPlugin)
final class StoreSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "StoreSessionPlugin"
    let jsName = "NativeSession"
    let pluginMethods = [
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearToken", returnType: CAPPluginReturnPromise)
    ]

    private var service: String {
        (Bundle.main.bundleIdentifier ?? "com.ladduzabardast.app") + ".session"
    }

    private func query(for call: CAPPluginCall) -> [String: Any]? {
        guard let server = call.getString("server"), !server.isEmpty else {
            call.reject("A store server is required.")
            return nil
        }
        return [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: server
        ]
    }

    @objc func getToken(_ call: CAPPluginCall) {
        guard var query = query(for: call) else { return }
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        switch SecItemCopyMatching(query as CFDictionary, &result) {
        case errSecItemNotFound:
            call.resolve()
        case errSecSuccess:
            guard let data = result as? Data, let token = String(data: data, encoding: .utf8) else {
                call.reject("Could not read your saved session.")
                return
            }
            call.resolve(["token": token])
        default:
            call.reject("Could not read your saved session.")
        }
    }

    @objc func setToken(_ call: CAPPluginCall) {
        guard let query = query(for: call) else { return }
        guard let token = call.getString("token"), !token.isEmpty else {
            call.reject("A session token is required.")
            return
        }
        let value = Data(token.utf8)
        var item = query
        item[kSecValueData as String] = value
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        var status = SecItemAdd(item as CFDictionary, nil)
        if status == errSecDuplicateItem {
            status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: value] as CFDictionary)
        }
        if status == errSecSuccess {
            call.resolve()
        } else {
            call.reject("Could not save your session.")
        }
    }

    @objc func clearToken(_ call: CAPPluginCall) {
        guard let query = query(for: call) else { return }
        let status = SecItemDelete(query as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Could not clear your saved session.")
        }
    }
}

@objc(StoreExternalSignInPlugin)
final class StoreExternalSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    private var authSession: ASWebAuthenticationSession?
    let identifier = "StoreExternalSignInPlugin"
    let jsName = "ExternalSignIn"
    let pluginMethods = [
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    // Use the system CSPRNG and SHA-256 even when the custom WKWebView scheme
    // does not expose SubtleCrypto.
    @objc func prepare(_ call: CAPPluginCall) {
        var bytes = Data(count: 32)
        let status = bytes.withUnsafeMutableBytes { buffer -> Int32 in
            guard let address = buffer.baseAddress else { return errSecParam }
            return SecRandomCopyBytes(kSecRandomDefault, buffer.count, address)
        }
        guard status == errSecSuccess else {
            call.reject("Could not prepare Google sign-in.")
            return
        }
        let verifier = base64URL(bytes)
        let challenge = base64URL(Data(SHA256.hash(data: Data(verifier.utf8))))
        call.resolve(["verifier": verifier, "challenge": challenge])
    }

    @objc func open(_ call: CAPPluginCall) {
        guard let value = call.getString("url"),
              let components = URLComponents(string: value),
              components.scheme == "https", components.host == "accounts.google.com",
              components.user == nil, components.password == nil, components.port == nil,
              components.path == "/o/oauth2/v2/auth",
              let url = components.url else {
            call.reject("Invalid Google sign-in link.")
            return
        }

        DispatchQueue.main.async {
            guard self.authSession == nil else {
                call.reject("Google sign-in is already open.")
                return
            }
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "ladduzabardast") { callback, error in
                DispatchQueue.main.async {
                    self.authSession = nil
                    if let callback {
                        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: callback)
                    } else if let state = components.queryItems?.first(where: { $0.name == "state" })?.value {
                        var result = URLComponents(string: "ladduzabardast://oauth/google")
                        let failure = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin ? "cancelled" : "failed"
                        result?.queryItems = [URLQueryItem(name: "state", value: state), URLQueryItem(name: "error", value: failure)]
                        if let resultURL = result?.url {
                            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: resultURL)
                        }
                    }
                }
            }
            session.presentationContextProvider = self
            self.authSession = session
            if session.start() {
                call.resolve()
            } else {
                self.authSession = nil
                call.reject("Could not open Google sign-in.")
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }

    private func base64URL(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
