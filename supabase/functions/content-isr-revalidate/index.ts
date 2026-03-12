/**
 * P0-037 — Supabase Edge Function: content-isr-revalidate
 *
 * Fires when content_records.status changes to 'published' or 'archived'.
 * Calls the Next.js /api/revalidate endpoint to trigger ISR cache purge.
 *
 * Trigger source: Supabase Database Webhook on content_records UPDATE
 * Target: POST https://<NEXT_PUBLIC_SITE_URL>/api/revalidate
 * Auth: Bearer <REVALIDATE_SECRET>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: ContentRecord
  old_record: ContentRecord | null
}

interface ContentRecord {
  id: string
  slug: string
  status: string
  brand: string
  city_id: string
}

interface RevalidatePayload {
  geoSlug: string
  contentSlug: string
  status: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_STATUSES = ['published', 'archived']

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Only accept POST from Supabase webhook
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json()

    // Only process content_records UPDATE events
    if (payload.type !== 'UPDATE' || payload.table !== 'content_records') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not a content_records UPDATE' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const record = payload.record
    const oldRecord = payload.old_record

    // Only fire on status transitions to 'published' or 'archived'
    const statusChanged = oldRecord?.status !== record.status
    const isTargetStatus = TRIGGER_STATUSES.includes(record.status)

    if (!statusChanged || !isTargetStatus) {
      return new Response(JSON.stringify({
        skipped: true,
        reason: `status ${record.status} is not a trigger status or did not change`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Resolve city slug from city_id ────────────────────────────────────────

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('slug')
      .eq('id', record.city_id)
      .single()

    if (cityError || !cityData?.slug) {
      console.error('[content-isr-revalidate] Failed to resolve city slug:', cityError)
      return new Response(JSON.stringify({ error: 'City not found', city_id: record.city_id }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const geoSlug = cityData.slug
    const contentSlug = record.slug

    // ── Call Next.js /api/revalidate ──────────────────────────────────────────

    const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL')!
    const revalidateSecret = Deno.env.get('REVALIDATE_SECRET')!

    const revalidatePayload: RevalidatePayload = {
      geoSlug,
      contentSlug,
      status: record.status,
    }

    console.log(`[content-isr-revalidate] Triggering ISR for ${geoSlug}/${contentSlug} (status: ${record.status})`)

    const revalidateResponse = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${revalidateSecret}`,
      },
      body: JSON.stringify(revalidatePayload),
    })

    const revalidateResult = await revalidateResponse.json()

    if (!revalidateResponse.ok) {
      console.error('[content-isr-revalidate] Revalidation failed:', revalidateResult)
      return new Response(JSON.stringify({
        error: 'Revalidation endpoint returned error',
        status: revalidateResponse.status,
        result: revalidateResult,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Log event to Supabase ─────────────────────────────────────────────────

    const { error: logError } = await supabase
      .from('edge_function_logs')
      .insert({
        function_name: 'content-isr-revalidate',
        content_record_id: record.id,
        trigger_status: record.status,
        geo_slug: geoSlug,
        content_slug: contentSlug,
        revalidate_status_code: revalidateResponse.status,
        success: true,
        payload: revalidateResult,
      })

    if (logError) {
      // Non-fatal — log but don't fail the function
      console.warn('[content-isr-revalidate] Log insert failed (non-fatal):', logError.message)
    }

    console.log(`[content-isr-revalidate] ISR triggered successfully for ${geoSlug}/${contentSlug}`)

    return new Response(JSON.stringify({
      success: true,
      geoSlug,
      contentSlug,
      status: record.status,
      revalidated: revalidateResult,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[content-isr-revalidate] Unhandled error:', err)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
