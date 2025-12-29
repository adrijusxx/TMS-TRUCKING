import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PITCH_DECK_FILE = path.join(DATA_DIR, 'pitch-deck.json');

/**
 * GET /api/pitch-deck
 * Fetch the current pitch deck data
 */
export async function GET() {
  try {
    // Check if file exists
    if (!existsSync(PITCH_DECK_FILE)) {
      return NextResponse.json(
        { error: 'Pitch deck not found' },
        { status: 404 }
      );
    }

    const data = await readFile(PITCH_DECK_FILE, 'utf-8');
    const pitchDeck = JSON.parse(data);

    return NextResponse.json(pitchDeck);
  } catch (error) {
    console.error('Failed to read pitch deck:', error);
    return NextResponse.json(
      { error: 'Failed to read pitch deck' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pitch-deck
 * Save the pitch deck data
 */
export async function POST(request: NextRequest) {
  try {
    const pitchDeck = await request.json();

    // Validate basic structure
    if (!pitchDeck.id || !pitchDeck.slides || !Array.isArray(pitchDeck.slides)) {
      return NextResponse.json(
        { error: 'Invalid pitch deck structure' },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    // Update last modified timestamp
    pitchDeck.lastModified = new Date().toISOString();

    // Write to file
    await writeFile(PITCH_DECK_FILE, JSON.stringify(pitchDeck, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Pitch deck saved successfully',
      lastModified: pitchDeck.lastModified,
    });
  } catch (error) {
    console.error('Failed to save pitch deck:', error);
    return NextResponse.json(
      { error: 'Failed to save pitch deck' },
      { status: 500 }
    );
  }
}


















