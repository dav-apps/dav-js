// Generic request errors
export const UnexpectedError = 1000
export const AuthenticationFailed = 1001
export const ActionNotAllowed = 1002
export const ContentTypeNotSupported = 1003

// Errors for missing headers
export const AuthorizationHeaderMissing = 1100
export const ContentTypeHeaderMissing = 1101

// File errors
export const ContentTypeDoesNotMatchFileType = 1200
export const ImageFileInvalid = 1201
export const ImageFileTooLarge = 1202

// Generic request body errors
export const InvalidBody = 2000
export const PurchaseRequiresAtLeastOneTableObject = 2001

// Missing fields
export const AccessTokenMissing = 2100
export const AppIdMissing = 2101
export const TableIdMissing = 2102
export const EmailMissing = 2103
export const FirstNameMissing = 2104
export const PasswordMissing = 2105
export const EmailConfirmationTokenMissing = 2106
export const PasswordConfirmationTokenMissing = 2107
export const CountryMissing = 2108
export const ApiKeyMissing = 2109
export const NameMissing = 2110
export const DescriptionMissing = 2111
export const PropertiesMissing = 2112
export const ProductNameMissing = 2115
export const ProductImageMissing = 2116
export const CurrencyMissing = 2117
export const EndpointMissing = 2118
export const P256dhMissing = 2119
export const AuthMissing = 2120
export const TimeMissing = 2121
export const IntervalMissing = 2122
export const TitleMissing = 2123
export const BodyMissing = 2124
export const PathMissing = 2125
export const MethodMissing = 2126
export const CommandsMissing = 2127
export const ErrorsMissing = 2128
export const EnvVarsMissing = 2129
export const TableObjectsMissing = 2130
export const SlotMissing = 2131
export const PlanMissing = 2132
export const SuccessUrlMissing = 2133
export const CancelUrlMissing = 2134

// Fields with wrong type
export const AccessTokenWrongType = 2200
export const UuidWrongType = 2201
export const AppIdWrongType = 2202
export const TableIdWrongType = 2203
export const EmailWrongType = 2204
export const FirstNameWrongType = 2205
export const PasswordWrongType = 2206
export const EmailConfirmationTokenWrongType = 2207
export const PasswordConfirmationTokenWrongType = 2208
export const CountryWrongType = 2209
export const ApiKeyWrongType = 2210
export const DeviceNameWrongType = 2211
export const DeviceOsWrongType = 2213
export const NameWrongType = 2214
export const DescriptionWrongType = 2215
export const PublishedWrongType = 2216
export const WebLinkWrongType = 2217
export const GooglePlayLinkWrongType = 2218
export const MicrosoftStoreLinkWrongType = 2219
export const FileWrongType = 2220
export const PropertiesWrongType = 2221
export const PropertyNameWrongType = 2222
export const PropertyValueWrongType = 2223
export const ExtWrongType = 2224
export const ProductNameWrongType = 2227
export const ProductImageWrongType = 2228
export const CurrencyWrongType = 2229
export const EndpointWrongType = 2230
export const P256dhWrongType = 2231
export const AuthWrongType = 2232
export const TimeWrongType = 2233
export const IntervalWrongType = 2234
export const TitleWrongType = 2235
export const BodyWrongType = 2236
export const PathWrongType = 2237
export const MethodWrongType = 2238
export const CommandsWrongType = 2239
export const CachingWrongType = 2240
export const ParamsWrongType = 2241
export const ErrorsWrongType = 2242
export const CodeWrongType = 2243
export const MessageWrongType = 2244
export const EnvVarsWrongType = 2245
export const EnvVarNameWrongType = 2246
export const EnvVarValueWrongType = 2247
export const TableObjectsWrongType = 2248
export const SlotWrongType = 2249
export const PlanWrongType = 2250
export const SuccessUrlWrongType = 2251
export const CancelUrlWrongType = 2252
export const ModeWrongType = 2253

// Too short fields
export const FirstNameTooShort = 2300
export const PasswordTooShort = 2301
export const DeviceNameTooShort = 2302
export const DeviceOsTooShort = 2304
export const NameTooShort = 2305
export const DescriptionTooShort = 2306
export const WebLinkTooShort = 2307
export const GooglePlayLinkTooShort = 2308
export const MicrosoftStoreLinkTooShort = 2309
export const PropertyNameTooShort = 2310
export const PropertyValueTooShort = 2311
export const ExtTooShort = 2312
export const ProductNameTooShort = 2315
export const ProductImageTooShort = 2316
export const EndpointTooShort = 2317
export const P256dhTooShort = 2318
export const AuthTooShort = 2319
export const TitleTooShort = 2320
export const BodyTooShort = 2321
export const PathTooShort = 2322
export const CommandsTooShort = 2323
export const ParamsTooShort = 2324
export const MessageTooShort = 2325
export const EnvVarNameTooShort = 2326
export const EnvVarValueTooShort = 2327
export const SlotTooShort = 2328

// Too long fields
export const FirstNameTooLong = 2400
export const PasswordTooLong = 2401
export const DeviceNameTooLong = 2402
export const DeviceOsTooLong = 2404
export const NameTooLong = 2405
export const DescriptionTooLong = 2406
export const WebLinkTooLong = 2407
export const GooglePlayLinkTooLong = 2408
export const MicrosoftStoreLinkTooLong = 2409
export const PropertyNameTooLong = 2410
export const PropertyValueTooLong = 2411
export const ExtTooLong = 2412
export const ProductNameTooLong = 2415
export const ProductImageTooLong = 2416
export const EndpointTooLong = 2417
export const P256dhTooLong = 2418
export const AuthTooLong = 2419
export const TitleTooLong = 2420
export const BodyTooLong = 2421
export const PathTooLong = 2422
export const CommandsTooLong = 2423
export const ParamsTooLong = 2424
export const MessageTooLong = 2425
export const EnvVarNameTooLong = 2426
export const EnvVarValueTooLong = 2427
export const SlotTooLong = 2428

// Invalid fields
export const EmailInvalid = 2500
export const NameInvalid = 2501
export const WebLinkInvalid = 2502
export const GooglePlayLinkInvalid = 2503
export const MicrosoftStoreLinkInvalid = 2504
export const MethodInvalid = 2505
export const SlotInvalid = 2506
export const PlanInvalid = 2507
export const SuccessUrlInvalid = 2508
export const CancelUrlInvalid = 2509
export const ModeInvalid = 2510
export const ProductImageInvalid = 2511

// Generic state errors
export const UserIsAlreadyConfirmed = 3000
export const UserOfTableObjectMustHaveProvider = 3001
export const UserAlreadyPurchasedThisTableObject = 3002
export const UserHasNoPaymentInformation = 3003
export const UserAlreadyHasStripeCustomer = 3004
export const TableObjectIsNotFile = 3005
export const TableObjectHasNoFile = 3006
export const NotSufficientStorageAvailable = 3007
export const TableObjectNeedsToBelongToSameUser = 3009
export const PurchaseCannotBeDeleted = 3010
export const UserIsAlreadyOnThisOrHigherPlan = 3011

// Access token errors
export const CannotUseOldAccessToken = 3100
export const AccessTokenMustBeRenewed = 3101

// Incorrect values
export const IncorrectPassword = 3200
export const IncorrectEmailConfirmationToken = 3201
export const IncorrectPasswordConfirmationToken = 3202

// Not supported values
export const CountryNotSupported = 3300

// Errors for values already in use
export const UuidAlreadyInUse = 3400
export const EmailAlreadyInUse = 3401

// Errors for empty values in User
export const OldEmailOfUserIsEmpty = 3500
export const NewEmailOfUserIsEmpty = 3501
export const NewPasswordOfUserIsEmpty = 3502

// Errors for not existing resources
export const UserDoesNotExist = 3600
export const DevDoesNotExist = 3601
export const ProviderDoesNotExist = 3602
export const SessionDoesNotExist = 3603
export const AppDoesNotExist = 3604
export const TableDoesNotExist = 3605
export const TableObjectDoesNotExist = 3606
export const TableObjectPriceDoesNotExist = 3607
export const TableObjectUserAccessDoesNotExist = 3608
export const PurchaseDoesNotExist = 3609
export const WebPushSubscriptionDoesNotExist = 3610
export const NotificationDoesNotExist = 3611
export const ApiDoesNotExist = 3612
export const ApiEndpointDoesNotExist = 3613
export const CompiledApiEndpointDoesNotExist = 3614
export const ApiSlotDoesNotExist = 3615
export const CollectionDoesNotExist = 3616

// Errors for already existing resources
export const UserAlreadyExists = 3700
export const DevAlreadyExists = 3701
export const ProviderAlreadyExists = 3702
export const SessionAlreadyExists = 3703
export const AppAlreadyExists = 3704
export const TableAlreadyExists = 3705
export const TableObjectAlreadyExists = 3706
export const TableObjectPriceAlreadyExists = 3707
export const TableObjectUserAccessAlreadyExists = 3708
export const PurchaseAlreadyExists = 3709
export const WebPushSubscriptionAlreadyExists = 3710
export const NotificationAlreadyExists = 3711
export const ApiAlreadyExists = 3712
export const ApiEndpointAlreadyExists = 3713
export const CompiledApiEndpointAlreadyExists = 3714
export const ApiSlotAlreadyExists = 3715
export const CollectionAlreadyExists = 3716
