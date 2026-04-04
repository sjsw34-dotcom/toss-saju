---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/RN-BannerAd.md
---
# 인앱 광고 2.0 ver2 (배너 광고 - React Native)

React Native에서는 `TossAds.attachBanner` 대신 `InlineAd` 컴포넌트를 사용해 배너를 렌더링해요.

:::tip 테스트용 배너 광고 ID

* 배너 광고 - 리스트형 : `ait-ad-test-banner-id`
* 배너 광고 - 피드형 : `ait-ad-test-native-image-id`
  :::

## 지원 버전

배너 광고 API는 토스 앱 버전에 따라 다르게 동작해요 :

| 토스 앱 버전     | 지원 여부 | 설명                    |
| ---------------- | --------- | ----------------------- |
| **5.241.0 이상** | 지원      | 배너 광고 사용 가능     |
| **5.241.0 미만** | 미지원    | 배너 광고 API 사용 불가 |

> `isSupported()` 메서드를 사용하여 현재 환경에서 배너 광고를 사용할 수 있는지 확인할 수 있어요.

::: tip 5.241.0 미만 버전 예외 처리
토스앱 5.241.0 미만에서는 빈 화면이 노출될 수 있으니 반드시 예외 처리를 해주세요.\
[토스앱 버전 가져오기](/bedrock/reference/framework/환경%20확인/getTossAppVersion.html) 기능을 사용해 예외 처리를 해주세요.
:::

## API 개요

* 패키지: `@apps-in-toss/framework`
* 주요 API: `InlineAd` 컴포넌트
* 전제: 토스 앱 환경 + 최소 버전 충족 시 정상 동작
* 참고: RN `InlineAd` 문서는 `initialize/attach/destroyAll`을 기본 경로로 사용하지 않아요.

***

## 이벤트 플로우

```
InlineAd mount 또는 adGroupId 변경
↓
광고 로드(loadAd)
↓
onAdRendered
↓
onAdImpression (IMP_1PX)
↓
onAdViewable (50% 노출 + 1초 유지)
↓
onAdClicked (사용자 클릭 시)
```

***

## 빠른 시작

```tsx
import { InlineAd } from '@apps-in-toss/framework';

export function BannerSection() {
  return (
    <InlineAd
      adGroupId="ait-ad-test-banner-id"
      theme="auto"
      tone="blackAndWhite"
      variant="expanded"
      onAdRendered={(payload) => console.log('onAdRendered', payload)}
      onAdImpression={(payload) => console.log('onAdImpression', payload)}
      onAdViewable={(payload) => console.log('onAdViewable', payload)}
      onAdClicked={(payload) => console.log('onAdClicked', payload)}
      onNoFill={(payload) => console.log('onNoFill', payload)}
      onAdFailedToRender={(payload) => console.log('onAdFailedToRender', payload)}
    />
  );
}
```

## Props

```tsx
type InlineAdTheme = 'auto' | 'light' | 'dark';
type InlineAdTone = 'blackAndWhite' | 'grey';
type InlineAdVariant = 'expanded' | 'card';

interface InlineAdProps {
  adGroupId: string;
  theme?: InlineAdTheme;
  tone?: InlineAdTone;
  variant?: InlineAdVariant;
  impressFallbackOnMount?: boolean;
}
```

* `adGroupId` (필수): 광고 그룹 ID
* `theme` (기본값 `auto`)
* `tone` (기본값 `blackAndWhite`)
* `variant` (기본값 `expanded`)
* `impressFallbackOnMount` (선택): 최상위 스크롤이 `IOScrollView`가 아닐 때, 노출 이벤트 fallback 처리를 위해 설정해주세요.

## 콜백 및 페이로드

```tsx
interface BannerSlotEventPayload {
  slotId: string;
  adGroupId: string;
  adMetadata: {
    creativeId: string;
    requestId: string;
    styleId: string;
  };
}

interface BannerSlotErrorPayload {
  slotId: string;
  adGroupId: string;
  adMetadata: {};
  error: {
    code: number;
    message: string;
    domain?: string;
  };
}
```

* `onAdRendered`: 광고 데이터가 렌더 가능한 상태가 된 직후
* `onAdImpression`: `IMP_1PX` 시점(수익 이벤트 기준)
* `onAdViewable`: 50% 이상 노출 상태가 1초 유지된 시점
* `onAdClicked`: 사용자가 광고 영역 클릭한 시점
* `onNoFill`: 광고 재고 없음
* `onAdFailedToRender`: 렌더 실패/환경 미지원/파라미터 오류

## 리프레시 동작

* 앱/화면 visibility가 `visible`로 돌아왔을 때, 마지막 `IMP_1PX` 이후 10초 이상 지났으면 재로드돼요.

## 에러 처리

* 미지원 환경: `This feature is not supported in the current environment`
* `adGroupId` 누락/잘못된 값: `onAdFailedToRender`로 에러 payload 전달
* 광고 없음: `onNoFill`
* 서버/네트워크/내부 오류: `onAdFailedToRender`

## 레이아웃 가이드

* 고정형: 너비 `100%`, 높이 `96` 권장
* 인라인: 너비 `100%`, 높이 미지정(콘텐츠 높이 자동)

```tsx
import { View } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';

export function FixedBanner() {
  return (
    <View style={{ width: '100%', height: 96, overflow: 'hidden' }}>
      <InlineAd adGroupId="ait-ad-test-banner-id" />
    </View>
  );
}

export function InlineBanner() {
  return (
    <View style={{ width: '100%' }}>
      <InlineAd adGroupId="ait-ad-test-banner-id" />
    </View>
  );
}
```

## 노출 측정

`InlineAd`는 노출 측정을 위해 `IOContext.Provider` 컨텍스트를 사용해요.\
아래 둘 중 하나를 반드시 만족해야 합니다.

| 조건                                    | 권장 설정                                            |
| --------------------------------------- | ---------------------------------------------------- |
| 최상위 스크롤 컨테이너를 제어할 수 있음 | `@granite-js/react-native`의 `IOScrollView`로 감싸기 |
| `IOScrollView` 적용이 어려움            | `InlineAd`에 `impressFallbackOnMount={true}` 설정    |

### 권장 패턴 1: `IOScrollView` 사용

```tsx
import { IOScrollView } from '@granite-js/react-native';
import { InlineAd } from '@apps-in-toss/framework';

export function Screen() {
  return (
    <IOScrollView>
      <InlineAd adGroupId="ait-ad-test-banner-id" />
    </IOScrollView>
  );
}
```

### 대체 패턴 2: fallback 사용

:::tip prop 사용

`impressFallbackOnMount` prop 은 IOScrollView 컨텍스트가 없어도 InlineAd가 마운트될 때 노출(impression) fallback 로직을 수행합니다.
:::

```tsx
import { ScrollView } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';

export function Screen() {
  return (
    <ScrollView>
      <InlineAd adGroupId="ait-ad-test-banner-id" impressFallbackOnMount={true} />
    </ScrollView>
  );
}
```

***

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: "광고가 보이지 않아요",
a: \`1. 토스 앱 환경 및 최소 버전을 확인해주세요.
